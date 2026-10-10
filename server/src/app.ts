import cors from 'cors';
import { randomUUID } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { validateBody } from './middleware/validate.js';
import { assessmentSchema } from './schemas/assessment.js';
import { ideas, products } from './data/catalog.js';
import { recommendAssessment } from './services/recommendation.js';
import { requireAuth } from './middleware/authenticate.js';
import { imageUpload } from './middleware/upload.js';
import { analyseDeviceImage, cloudflareAiErrorMessage, cloudflareAiStatus, generateRepairPlan } from './services/aiAnalysis.js';
import { collectionRequestSchema } from './schemas/collection.js';
import { AssessmentModel } from './models/assessment.js';
import { CollectionRequestModel } from './models/collectionRequest.js';
import { IdeaProjectModel } from './models/ideaProject.js';
import { MarketplaceListingModel } from './models/marketplaceListing.js';
import { ideaProjectSchema, ideaStepSchema } from './schemas/ideaProject.js';
import { marketplaceListingSchema } from './schemas/marketplaceListing.js';
import { ideaImageUpload } from './middleware/upload.js';
import { marketplaceImageUpload } from './middleware/upload.js';
import { removeIdeaImage, signedIdeaImageUrl, storageConfigured, uploadIdeaImage, uploadMarketplaceImage, uploadAssessmentImage } from './services/ideaStorage.js';
import mongoose from 'mongoose';
import { FeedbackModel } from './models/feedback.js';
import { feedbackSchema } from './schemas/feedback.js';
import { MarketplaceRequestModel } from './models/marketplaceRequest.js';
import { marketplaceRequestSchema, marketplaceRequestStatusSchema } from './schemas/marketplaceRequest.js';
import { z } from 'zod';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '100kb' }));
app.use((_request, response, next) => {
  response.setHeader('x-request-id', randomUUID());
  next();
});

app.get('/api/v1/health', (_request, response) => {
  response.json({
    data: { status: 'ok', service: 'powercycle-api', database: mongoose.connection.readyState === 1 },
    error: null,
    meta: {},
  });
  });

  app.get('/api/v1/products', (_request, response) => {
    response.json({ data: products, error: null, meta: { count: products.length } });
  });

  app.get('/api/v1/products/:slug', (request, response) => {
    const product = products.find((item) => item.slug === request.params.slug);
    if (!product) {
      response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Product not found.' }, meta: {} });
      return;
    }
    response.json({ data: product, error: null, meta: {} });
  });

  app.get('/api/v1/marketplace/listings', async (request, response) => {
    if (mongoose.connection.readyState !== 1) {
      response.json({ data: [], error: null, meta: { persisted: false, count: 0 } });
      return;
    }
    const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';
    const filter = query ? { status: 'active', $or: [{ title: new RegExp(query, 'i') }, { description: new RegExp(query, 'i') }, { category: new RegExp(query, 'i') }] } : { status: 'active' };
    const listings = await MarketplaceListingModel.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    const data = await Promise.all(listings.map(async (listing) => ({
      id: String(listing._id), title: listing.title, description: listing.description,
      category: listing.category, condition: listing.condition, priceInr: listing.pricePaise / 100,
      currency: listing.currency, stockQuantity: listing.stockQuantity, pickupAvailable: listing.pickupAvailable,
      shippingAvailable: listing.shippingAvailable, publicCity: listing.publicCity, publicState: listing.publicState,
      createdAt: listing.createdAt,
      images: await Promise.all(listing.images.map(async (image) => ({ url: await signedIdeaImageUrl(image.storageKey) }))),
    })));
    response.json({ data, error: null, meta: { persisted: true, count: data.length } });
  });

  app.get('/api/v1/marketplace/listings/:id', async (request, response, next) => {
    if (request.params.id === 'me') { next(); return; }
    if (!mongoose.isValidObjectId(request.params.id) || mongoose.connection.readyState !== 1) {
      response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Listing not found.' }, meta: {} }); return;
    }
    const listing = await MarketplaceListingModel.findOne({ _id: request.params.id, status: 'active' }).lean();
    if (!listing) { response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Listing not found.' }, meta: {} }); return; }
    response.json({ data: {
      id: String(listing._id), title: listing.title, description: listing.description, category: listing.category,
      condition: listing.condition, priceInr: listing.pricePaise / 100, currency: listing.currency,
      stockQuantity: listing.stockQuantity, pickupAvailable: listing.pickupAvailable, shippingAvailable: listing.shippingAvailable,
      publicCity: listing.publicCity, publicState: listing.publicState, createdAt: listing.createdAt,
      sellerPhone: listing.showContactPhone ? listing.contactPhone : undefined,
      images: await Promise.all(listing.images.map(async (image) => ({ url: await signedIdeaImageUrl(image.storageKey) }))),
    }, error: null, meta: { persisted: true } });
  });

  app.get('/api/v1/marketplace/listings/me', requireAuth, async (request, response) => {
    if (!request.authUser || mongoose.connection.readyState !== 1) {
      response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Your marketplace listings are unavailable until database storage is configured.' }, meta: {} });
      return;
    }
    const listings = await MarketplaceListingModel.find({ sellerUserId: request.authUser.id, status: { $ne: 'removed' } }).sort({ createdAt: -1 }).lean();
    const data = await Promise.all(listings.map(async (listing) => ({
      id: String(listing._id), title: listing.title, description: listing.description, category: listing.category,
      condition: listing.condition, priceInr: listing.pricePaise / 100, stockQuantity: listing.stockQuantity,
      contactPhone: listing.contactPhone, showContactPhone: listing.showContactPhone,
      status: listing.status, createdAt: listing.createdAt,
      images: await Promise.all(listing.images.map(async (image) => ({ url: await signedIdeaImageUrl(image.storageKey) }))),
    })));
    response.json({ data, error: null, meta: { persisted: true, count: data.length } });
  });

  app.patch('/api/v1/marketplace/listings/:id', requireAuth, async (request, response) => {
    const status = request.body?.status;
    if (!request.authUser || !mongoose.isValidObjectId(request.params.id) || !['active', 'paused', 'sold_out'].includes(status)) {
      response.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Choose active, paused, or sold_out for your listing.' }, meta: {} }); return;
    }
    const listing = await MarketplaceListingModel.findOneAndUpdate(
      { _id: request.params.id, sellerUserId: request.authUser.id, status: { $ne: 'removed' } },
      { status }, { new: true, runValidators: true },
    );
    if (!listing) { response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Listing not found.' }, meta: {} }); return; }
    response.json({ data: { id: listing.id, status: listing.status, updatedAt: listing.updatedAt }, error: null, meta: { persisted: true } });
  });

  app.delete('/api/v1/marketplace/listings/:id', requireAuth, async (request, response) => {
    if (!request.authUser || !mongoose.isValidObjectId(request.params.id)) { response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Listing not found.' }, meta: {} }); return; }
    const listing = await MarketplaceListingModel.findOneAndUpdate(
      { _id: request.params.id, sellerUserId: request.authUser.id, status: { $ne: 'removed' } },
      { status: 'removed' }, { new: true },
    );
    if (!listing) { response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Listing not found.' }, meta: {} }); return; }
    response.json({ data: { id: listing.id, status: listing.status }, error: null, meta: { persisted: true } });
  });

  app.post('/api/v1/marketplace/requests', requireAuth, async (request, response) => {
    const parsed = marketplaceRequestSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid request.' }, meta: {} }); return; }
    if (!request.authUser?.email) { response.status(400).json({ data: null, error: { code: 'EMAIL_REQUIRED', message: 'A verified account email is required to contact the seller.' }, meta: {} }); return; }
    if (mongoose.connection.readyState !== 1) { response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Marketplace requests need database storage.' }, meta: {} }); return; }
    const listing = await MarketplaceListingModel.findOne({ _id: parsed.data.listingId, status: 'active', stockQuantity: { $gte: parsed.data.quantity } }).lean();
    if (!listing) { response.status(409).json({ data: null, error: { code: 'LISTING_UNAVAILABLE', message: 'This listing is unavailable or does not have enough quantity.' }, meta: {} }); return; }
    if (listing.sellerUserId === request.authUser.id) { response.status(400).json({ data: null, error: { code: 'OWN_LISTING', message: 'You cannot request your own listing.' }, meta: {} }); return; }
    const saved = await MarketplaceRequestModel.create({ listingId: listing._id, listingTitle: listing.title, unitPricePaise: listing.pricePaise, quantity: parsed.data.quantity, buyerUserId: request.authUser.id, buyerEmail: request.authUser.email, buyerPhone: parsed.data.buyerPhone, sellerUserId: listing.sellerUserId, message: parsed.data.message, status: 'requested' });
    response.status(201).json({ data: { id: saved.id, status: saved.status, createdAt: saved.createdAt }, error: null, meta: { persisted: true, payment: 'not_collected', fulfilment: 'not_arranged' } });
  });

  app.get('/api/v1/marketplace/requests/me', requireAuth, async (request, response) => {
    if (!request.authUser || mongoose.connection.readyState !== 1) { response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Marketplace request history is unavailable.' }, meta: {} }); return; }
    const records = await MarketplaceRequestModel.find({ $or: [{ buyerUserId: request.authUser.id }, { sellerUserId: request.authUser.id }] }).sort({ createdAt: -1 }).limit(100).lean();
    const data = records.map((record) => {
      const isBuyer = record.buyerUserId === request.authUser!.id;
      const isSeller = record.sellerUserId === request.authUser!.id;
      return { id: String(record._id), listingId: String(record.listingId), listingTitle: record.listingTitle, quantity: record.quantity, unitPriceInr: record.unitPricePaise / 100, message: record.message, status: record.status, createdAt: record.createdAt, role: isBuyer ? 'buyer' : 'seller', buyerEmail: isSeller && record.status === 'accepted' ? record.buyerEmail : undefined, buyerPhone: isSeller && record.status === 'accepted' ? record.buyerPhone : undefined };
    });
    response.json({ data, error: null, meta: { persisted: true, count: data.length } });
  });

  app.patch('/api/v1/marketplace/requests/:id', requireAuth, async (request, response) => {
    const parsed = marketplaceRequestStatusSchema.safeParse(request.body);
    if (!request.authUser || !mongoose.isValidObjectId(request.params.id) || !parsed.success) { response.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Choose accept or decline for this request.' }, meta: {} }); return; }
    const record = await MarketplaceRequestModel.findOneAndUpdate({ _id: request.params.id, sellerUserId: request.authUser.id, status: 'requested' }, { status: 'processing' }, { new: true });
    if (!record) { response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Request not found or already handled.' }, meta: {} }); return; }
    let stockReserved = false;
    if (parsed.data.status === 'accepted') {
      const updated = await MarketplaceListingModel.findOneAndUpdate({ _id: record.listingId, sellerUserId: request.authUser.id, status: 'active', stockQuantity: { $gte: record.quantity } }, { $inc: { stockQuantity: -record.quantity } }, { new: true });
      if (!updated) { record.status = 'requested'; await record.save(); response.status(409).json({ data: null, error: { code: 'STOCK_CHANGED', message: 'The item no longer has enough available quantity. Decline this request or contact the buyer.' }, meta: {} }); return; }
      stockReserved = true;
      if (updated.stockQuantity === 0) await MarketplaceListingModel.updateOne({ _id: updated._id, stockQuantity: 0, status: 'active' }, { $set: { status: 'sold_out' } });
    }
    try { record.status = parsed.data.status; await record.save(); }
    catch (error) {
      if (stockReserved) await MarketplaceListingModel.updateOne({ _id: record.listingId }, { $inc: { stockQuantity: record.quantity }, $set: { status: 'active' } });
      await MarketplaceRequestModel.updateOne({ _id: record._id, status: 'processing' }, { $set: { status: 'requested' } });
      throw error;
    }
    response.json({ data: { id: record.id, status: record.status, updatedAt: record.updatedAt }, error: null, meta: { persisted: true, payment: 'not_collected', fulfilment: 'arrange_independently' } });
  });

  app.post('/api/v1/marketplace/listings', requireAuth, marketplaceImageUpload.array('images', 6), async (request, response) => {
    if (!request.authUser) {
      response.status(401).json({ data: null, error: { code: 'AUTH_REQUIRED', message: 'A valid sign-in session is required.' }, meta: {} });
      return;
    }
    if (mongoose.connection.readyState !== 1 || !storageConfigured()) {
      response.status(503).json({ data: null, error: { code: 'LISTING_STORAGE_NOT_CONFIGURED', message: 'MongoDB and Supabase Storage must be configured before listing a product.' }, meta: {} });
      return;
    }
    const parsed = marketplaceListingSchema.safeParse(request.body);
    const files = (request.files as Express.Multer.File[] | undefined) ?? [];
    if (!parsed.success || files.length < 1) {
      response.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: parsed.success ? 'Upload at least one product image.' : parsed.error.issues[0]?.message ?? 'Invalid listing data.' }, meta: {} });
      return;
    }
    if (parsed.data.showContactPhone && !/^\+?[\d\s().-]{7,20}$/.test(parsed.data.contactPhone)) {
      response.status(400).json({ data: null, error: { code: 'PHONE_REQUIRED', message: 'Enter a valid phone number or turn off public phone display.' }, meta: {} }); return;
    }
    if (parsed.data.sourceIdeaId) {
      if (!mongoose.isValidObjectId(parsed.data.sourceIdeaId) || !await IdeaProjectModel.exists({ _id: parsed.data.sourceIdeaId, ownerId: request.authUser.id, status: 'published' })) {
        response.status(400).json({ data: null, error: { code: 'SOURCE_IDEA_UNAVAILABLE', message: 'Only your own published idea can be linked to this listing.' }, meta: {} }); return;
      }
    }
    const uploadedKeys: string[] = [];
    try {
      const images = [];
      for (const file of files) {
        const image = await uploadMarketplaceImage(request.authUser.id, file);
        uploadedKeys.push(image.storageKey);
        images.push(image);
      }
      const saved = await MarketplaceListingModel.create({ ...parsed.data, sellerUserId: request.authUser.id, images, currency: 'INR', status: 'active' });
      response.status(201).json({ data: { id: saved.id, status: saved.status, createdAt: saved.createdAt }, error: null, meta: { persisted: true } });
    } catch {
      await Promise.all(uploadedKeys.map((key) => removeIdeaImage(key)));
      response.status(503).json({ data: null, error: { code: 'LISTING_SAVE_FAILED', message: 'Listing could not be saved. Please retry.' }, meta: {} });
    }
  });

  app.get('/api/v1/ideas', async (_request, response) => {
    const publishedProjects = mongoose.connection.readyState === 1
      ? await IdeaProjectModel.find({ status: 'published' }).sort({ publishedAt: -1 }).lean()
      : [];
    const communityIdeas = (await Promise.all(publishedProjects
      .filter((project) => project.coverImage && project.steps.every((step) => Boolean(step.image)))
      .map(async (project) => ({
        slug: String(project._id),
        title: project.title,
        description: project.shortDescription,
        difficulty: 'Community project',
        safetyNotes: 'Follow the creator instructions and disconnect power before handling electronics.',
        deviceCategory: project.deviceCategory,
        purposeCategory: project.purposeCategory,
        tags: project.tags,
        coverImage: { url: await signedIdeaImageUrl(project.coverImage!.storageKey) },
        steps: await Promise.all(project.steps.map(async (step) => ({
          id: step.stepId,
          title: step.title,
          description: step.description,
          position: step.position,
          image: { url: await signedIdeaImageUrl(step.image!.storageKey) },
        }))),
      })))).filter(Boolean);
    response.json({ data: [...communityIdeas, ...ideas], error: null, meta: { count: communityIdeas.length + ideas.length } });
  });

  app.get('/api/v1/ideas/readiness', requireAuth, (_request, response) => {
    response.json({ data: { database: mongoose.connection.readyState === 1, storage: storageConfigured(), ready: mongoose.connection.readyState === 1 && storageConfigured() }, error: null, meta: {} });
  });

  app.get('/api/v1/ideas/me', requireAuth, async (request, response) => {
    if (mongoose.connection.readyState !== 1 || !request.authUser) {
      response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Ideas storage is not configured.' }, meta: {} });
      return;
    }
    const projects = await IdeaProjectModel.find({ ownerId: request.authUser.id }).sort({ updatedAt: -1 }).lean();
    const projectsWithUrls = await Promise.all(projects.map(async (project) => ({
      ...project,
      coverImage: project.coverImage ? { ...project.coverImage, url: await signedIdeaImageUrl(project.coverImage.storageKey) } : null,
      steps: await Promise.all(project.steps.map(async (step) => step.image
        ? { ...step, image: { ...step.image, url: await signedIdeaImageUrl(step.image.storageKey) } }
        : step)),
    })));
    response.json({ data: projectsWithUrls, error: null, meta: { count: projects.length } });
  });

  app.post('/api/v1/ideas', requireAuth, ideaImageUpload.any(), async (request, response) => {
    if (!request.authUser) {
      response.status(401).json({ data: null, error: { code: 'AUTH_REQUIRED', message: 'A valid sign-in session is required.' }, meta: {} });
      return;
    }
    if (mongoose.connection.readyState !== 1 || !storageConfigured()) {
      response.status(503).json({ data: null, error: { code: 'IDEA_STORAGE_NOT_CONFIGURED', message: 'MongoDB and Supabase Storage must be configured before an idea can be saved.' }, meta: {} });
      return;
    }
    const parsed = ideaProjectSchema.safeParse({ ...request.body, steps: request.body.steps });
    if (!parsed.success) {
      response.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid project data.' }, meta: {} });
      return;
    }
    let stepPayload: Array<{ stepId: string; title: string; description: string }>;
    try { stepPayload = JSON.parse(parsed.data.steps) as Array<{ stepId: string; title: string; description: string }>; } catch { response.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Steps must be valid JSON.' }, meta: {} }); return; }
    if (stepPayload.length < 1 || stepPayload.length > 20 || stepPayload.some((step) => !ideaStepSchema.safeParse(step).success)) {
      response.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Add between 1 and 20 complete steps.' }, meta: {} });
      return;
    }
    const uploadedFiles = (request.files as Express.Multer.File[] | undefined) ?? [];
    if (uploadedFiles.some((file) => file.fieldname !== 'cover' && !file.fieldname.startsWith('step-')) || uploadedFiles.filter((file) => file.fieldname === 'cover').length > 1) {
      response.status(400).json({ data: null, error: { code: 'INVALID_IMAGE_FIELD', message: 'Only one cover image and one image per step are allowed.' }, meta: {} });
      return;
    }
    const files = uploadedFiles.reduce<Record<string, Express.Multer.File[]>>((grouped, file) => {
      grouped[file.fieldname] = [...(grouped[file.fieldname] ?? []), file];
      return grouped;
    }, {});
    const cover = files?.cover?.[0];
    const published = parsed.data.status === 'published';
    if ((published && !cover) || (published && stepPayload.some((step) => !files?.[`step-${step.stepId}`]?.[0]))) {
      response.status(400).json({ data: null, error: { code: 'IMAGE_REQUIRED', message: 'A cover and an image for every published step are required.' }, meta: {} });
      return;
    }
    const uploadedKeys: string[] = [];
    try {
      const coverImage = cover ? await uploadIdeaImage(request.authUser.id, cover) : undefined;
      if (coverImage) uploadedKeys.push(coverImage.storageKey);
      const steps = [];
      for (let index = 0; index < stepPayload.length; index += 1) {
        const step = stepPayload[index]; const file = files?.[`step-${step.stepId}`]?.[0];
        if (!file) { if (published) throw new Error('IMAGE_REQUIRED'); continue; }
        const image = file ? await uploadIdeaImage(request.authUser.id, file) : undefined;
        if (image) uploadedKeys.push(image.storageKey);
        steps.push({ ...step, position: index, ...(image ? { image } : {}) });
      }
      const saved = await IdeaProjectModel.create({ ownerId: request.authUser.id, title: parsed.data.title, shortDescription: parsed.data.shortDescription, deviceCategory: parsed.data.deviceCategory, purposeCategory: parsed.data.purposeCategory, tags: parsed.data.tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 10), coverImage, steps, status: published ? 'published' : 'draft', publishedAt: published ? new Date() : undefined });
      response.status(201).json({ data: { id: saved.id, status: saved.status, createdAt: saved.createdAt, updatedAt: saved.updatedAt }, error: null, meta: { persisted: true } });
    } catch (error) {
      await Promise.all(uploadedKeys.map((key) => removeIdeaImage(key)));
      const message = error instanceof Error && error.message === 'IMAGE_REQUIRED' ? 'A cover and an image for every published step are required.' : 'Idea could not be saved. Please retry.';
      response.status(503).json({ data: null, error: { code: 'IDEA_SAVE_FAILED', message }, meta: {} });
    }
  });

  app.get('/api/v1/ideas/:slug', requireAuth, async (request, response) => {
    if (mongoose.isValidObjectId(request.params.slug) && mongoose.connection.readyState === 1) {
      const project = await IdeaProjectModel.findOne({ _id: request.params.slug, status: 'published' }).lean();
      if (project && project.coverImage && project.steps.every((step) => Boolean(step.image))) {
        const coverUrl = await signedIdeaImageUrl(project.coverImage.storageKey);
        const steps = await Promise.all(project.steps.map(async (step) => ({ id: step.stepId, position: step.position, title: step.title, description: step.description, image: { url: await signedIdeaImageUrl(step.image!.storageKey) } })));
        response.json({ data: { slug: String(project._id), title: project.title, description: project.shortDescription, deviceCategory: project.deviceCategory, purposeCategory: project.purposeCategory, tags: project.tags, coverImage: { url: coverUrl }, steps, isOwner: project.ownerId === request.authUser?.id }, error: null, meta: {} });
        return;
      }
    }
    const idea = ideas.find((item) => item.slug === request.params.slug);
    if (!idea) {
      response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Idea not found.' }, meta: {} });
      return;
    }
    response.json({ data: idea, error: null, meta: {} });
  });

  app.patch('/api/v1/ideas/:id', requireAuth, ideaImageUpload.fields([{ name: 'cover', maxCount: 1 }]), async (request, response) => {
    if (!request.authUser || !mongoose.isValidObjectId(request.params.id) || mongoose.connection.readyState !== 1) {
      response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Idea not found.' }, meta: {} }); return;
    }
    const project = await IdeaProjectModel.findOne({ _id: request.params.id, ownerId: request.authUser.id });
    if (!project) { response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Idea not found.' }, meta: {} }); return; }
    const parsed = ideaProjectSchema.partial().safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid project update.' }, meta: {} }); return; }
    if (parsed.data.status === 'published' && project.status !== 'published') {
      if (!project.coverImage || project.steps.length === 0 || project.steps.some((step) => !step.image)) { response.status(400).json({ data: null, error: { code: 'PUBLISH_VALIDATION_ERROR', message: 'Complete all project images before publishing.' }, meta: {} }); return; }
      project.status = 'published'; project.publishedAt = new Date();
    }
    if (parsed.data.title) project.title = parsed.data.title;
    if (parsed.data.shortDescription) project.shortDescription = parsed.data.shortDescription;
    if (parsed.data.deviceCategory) project.deviceCategory = parsed.data.deviceCategory;
    if (parsed.data.purposeCategory) project.purposeCategory = parsed.data.purposeCategory;
    if (parsed.data.tags !== undefined) project.tags = parsed.data.tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 10);
    await project.save();
    response.json({ data: { id: project.id, status: project.status, updatedAt: project.updatedAt }, error: null, meta: { persisted: true } });
  });

  app.delete('/api/v1/ideas/:id', requireAuth, async (request, response) => {
    if (!request.authUser || !mongoose.isValidObjectId(request.params.id) || mongoose.connection.readyState !== 1) { response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Idea not found.' }, meta: {} }); return; }
    const project = await IdeaProjectModel.findOneAndUpdate({ _id: request.params.id, ownerId: request.authUser.id }, { status: 'archived' }, { new: true });
    if (!project) { response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Idea not found.' }, meta: {} }); return; }
    response.json({ data: { id: project.id, status: project.status }, error: null, meta: {} });
  });

  app.get('/api/v1/impact/summary', requireAuth, async (request, response) => {
    if (!request.authUser) {
      response.status(401).json({ data: null, error: { code: 'AUTH_REQUIRED', message: 'A valid sign-in session is required.' }, meta: {} });
      return;
    }
    if (mongoose.connection.readyState !== 1) {
      response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Impact data is unavailable until database storage is configured.' }, meta: {} });
      return;
    }
    const userId = request.authUser.id;
    const [assessments, collections, publishedIdeas, assessmentCount, collectionCount, publishedIdeaCount] = await Promise.all([
      AssessmentModel.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
      CollectionRequestModel.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
      IdeaProjectModel.find({ ownerId: userId, status: 'published' }).sort({ publishedAt: -1, createdAt: -1 }).limit(10).lean(),
      AssessmentModel.countDocuments({ userId }),
      CollectionRequestModel.countDocuments({ userId }),
      IdeaProjectModel.countDocuments({ ownerId: userId, status: 'published' }),
    ]);
    const recommendations = assessments.reduce<Record<string, number>>((counts, item) => {
      counts[item.recommendation] = (counts[item.recommendation] ?? 0) + 1;
      return counts;
    }, { repair: 0, reuse: 0, upcycle: 0, recycle: 0 });
    const collectionRequests = collections.reduce<Record<string, number>>((counts, item) => {
      const key = item.status === 'under-review' ? 'underReview' : item.status;
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, { submitted: collectionCount, underReview: 0, accepted: 0, completed: 0, rejected: 0 });
    const recentActivity = [
      ...assessments.map((item) => ({ id: String(item._id), type: 'assessment', title: `${item.deviceType} assessment`, createdAt: item.createdAt, status: item.recommendation, href: '/assess' })),
      ...publishedIdeas.map((item) => ({ id: String(item._id), type: 'idea', title: item.title, createdAt: item.publishedAt ?? item.createdAt, status: 'published', href: `/ideas/${item._id}` })),
      ...collections.map((item) => ({ id: String(item._id), type: 'collection', title: `${item.deviceCategory} collection request`, createdAt: item.createdAt, status: item.status, href: '/collection' })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
    response.json({
      data: {
        devicesAssessed: assessmentCount,
        completedAssessments: assessmentCount,
        secondLifeItems: 0,
        collectionRequests,
        verifiedEwasteKg: null,
        publishedIdeas: publishedIdeaCount,
        recommendations,
        recentActivity,
        dataQuality: { secondLifeItems: 'not_measured', verifiedEwasteKg: 'not_measured' },
      },
      error: null,
      meta: { persisted: true },
    });
  });

  app.post('/api/v1/assessments', requireAuth, validateBody(assessmentSchema.extend({ assessmentId: z.string().regex(/^[a-f\d]{24}$/i).optional(), brand: z.string().max(100).optional(), modelName: z.string().max(100).optional() })), async (request, response) => {
    const assessment = request.body;
    const result = recommendAssessment(assessment);
    if (mongoose.connection.readyState !== 1 || !request.authUser) {
      response.status(201).json({ data: result, error: null, meta: { persisted: false } });
      return;
    }
    try {
      const { assessmentId, ...details } = assessment;
      const saved = assessmentId
        ? await AssessmentModel.findOneAndUpdate({ _id: assessmentId, userId: request.authUser.id }, { ...details, ...result, userId: request.authUser.id }, { new: true, runValidators: true })
        : await AssessmentModel.create({ ...details, ...result, userId: request.authUser.id });
      if (!saved) { response.status(404).json({ data: null, error: { code: 'ASSESSMENT_NOT_FOUND', message: 'Assessment not found in your account. Please analyse the image again.' }, meta: {} }); return; }
      response.status(201).json({ data: { ...result, id: saved.id }, error: null, meta: { persisted: true, id: saved.id } });
    } catch { response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Assessment was not saved. Please try again later.' }, meta: {} }); }
  });

  app.get('/api/v1/ai/status', (_request, response) => {
    response.json({
      data: cloudflareAiStatus(),
      error: null,
      meta: {},
    });
  });

  app.post('/api/v1/ai/analyse-device', requireAuth, imageUpload.single('image'), async (request, response) => {
    if (request.body?.aiConsent !== 'true') {
      response.status(400).json({ data: null, error: { code: 'AI_CONSENT_REQUIRED', message: 'Confirm consent before sending a photo for AI analysis.' }, meta: {} });
      return;
    }
    if (!request.file) {
      response.status(400).json({ data: null, error: { code: 'IMAGE_REQUIRED', message: 'Please provide a supported image.' }, meta: {} });
      return;
    }
    const details = {
      deviceType: typeof request.body?.deviceType === 'string' ? request.body.deviceType : undefined,
      brand: typeof request.body?.brand === 'string' ? request.body.brand : undefined,
      modelName: typeof request.body?.modelName === 'string' ? request.body.modelName : undefined,
      condition: typeof request.body?.condition === 'string' ? request.body.condition : undefined,
      problem: typeof request.body?.problem === 'string' ? request.body.problem : undefined,
    };
    if (mongoose.connection.readyState !== 1 || !storageConfigured() || !request.authUser) {
      response.status(503).json({ data: null, error: { code: 'ASSESSMENT_STORAGE_UNAVAILABLE', message: 'Database and private image storage are required to save this assessment photo.' }, meta: {} }); return;
    }
    const parsedAssessment = assessmentSchema.safeParse({
      deviceType: request.body.deviceType, ageRange: request.body.ageRange ?? 'unknown', condition: request.body.condition ?? 'unknown',
      problems: request.body.problem && request.body.problem !== 'unknown' ? [request.body.problem] : [], notes: '',
    });
    if (!parsedAssessment.success) { response.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: 'Provide valid assessment details before analysing the photo.' }, meta: {} }); return; }
    const analysis = await analyseDeviceImage({ buffer: request.file.buffer, mimetype: request.file.mimetype }, details);
    const image = await uploadAssessmentImage(request.authUser.id, request.file);
    const recommendation = recommendAssessment(parsedAssessment.data);
    const saved = await AssessmentModel.create({ ...parsedAssessment.data, ...recommendation, brand: details.brand, modelName: details.modelName, aiAnalysis: analysis, image, userId: request.authUser.id });
    response.status(200).json({ data: { ...analysis, assessmentId: saved.id }, error: null, meta: { imageSavedPrivately: true } });
  });

  app.post('/api/v1/assessments/:id/repair-plan', requireAuth, async (request, response) => {
    if (!request.authUser || !mongoose.isValidObjectId(request.params.id)) { response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Assessment not found.' }, meta: {} }); return; }
    const assessment = await AssessmentModel.findOne({ _id: request.params.id, userId: request.authUser.id });
    if (!assessment) { response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Assessment not found.' }, meta: {} }); return; }
    try {
      const plan = await generateRepairPlan({ deviceType: assessment.deviceType, brand: assessment.brand ?? undefined, modelName: assessment.modelName ?? undefined, condition: assessment.condition, problems: assessment.problems, notes: assessment.notes ?? undefined, aiAnalysis: assessment.aiAnalysis as import('./services/aiAnalysis.js').AiAnalysis | undefined });
      assessment.repairPlan = { ...plan, generatedAt: new Date() };
      await assessment.save();
      response.json({ data: { ...plan, assessmentId: assessment.id }, error: null, meta: { persisted: true } });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'AI_UNAVAILABLE';
      response.status(503).json({ data: null, error: { code, message: code === 'AI_INVALID_RESPONSE' ? 'Cloudflare could not make a safe repair plan right now. Try again later.' : cloudflareAiErrorMessage(code) }, meta: {} });
    }
  });

  app.get('/api/v1/collection-requests/me', requireAuth, async (request, response) => {
    if (mongoose.connection.readyState !== 1 || !request.authUser) {
      response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Collection history is unavailable until database storage is configured.' }, meta: {} });
      return;
    }
    const requests = await CollectionRequestModel.find({ userId: request.authUser.id }).sort({ createdAt: -1 }).lean();
    response.json({ data: requests, error: null, meta: { persisted: true, count: requests.length } });
  });
  app.post('/api/v1/collection-requests', requireAuth, validateBody(collectionRequestSchema), (request, response) => {
    if (mongoose.connection.readyState !== 1 || !request.authUser) {
      response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Collection requests cannot be saved until database storage is configured.' }, meta: {} });
      return;
    }
    void CollectionRequestModel.create({ ...request.body, userId: request.authUser.id })
      .then((saved) => response.status(201).json({ data: { requestId: saved.id, status: saved.status, submittedAt: saved.createdAt, message: 'Request saved for review. A pickup is not confirmed until an authorized provider accepts it.' }, error: null, meta: { persisted: true } }))
      .catch(() => response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Collection request could not be saved. Please try again later.' }, meta: {} }));
  });
  app.post('/api/v1/feedback', requireAuth, async (request, response) => {
    const parsed = feedbackSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Please check your feedback.' }, meta: {} }); return; }
    if (!request.authUser) { response.status(401).json({ data: null, error: { code: 'AUTH_REQUIRED', message: 'A valid sign-in session is required.' }, meta: {} }); return; }
    if (mongoose.connection.readyState !== 1) { response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Feedback cannot be saved until database storage is configured.' }, meta: {} }); return; }
    const saved = await FeedbackModel.create({ ...parsed.data, userId: request.authUser.id });
    response.status(201).json({ data: { id: saved.id, createdAt: saved.createdAt }, error: null, meta: { persisted: true } });
  });
  app.get('/api/v1/activity/me', requireAuth, async (request, response) => {
    if (mongoose.connection.readyState !== 1 || !request.authUser) {
      response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Activity history is unavailable until database storage is configured.' }, meta: {} });
      return;
    }
    const [assessments, collectionRequests, ideas, marketplaceRequests] = await Promise.all([
      AssessmentModel.find({ userId: request.authUser.id }).sort({ createdAt: -1 }).limit(50).lean(),
      CollectionRequestModel.find({ userId: request.authUser.id }).sort({ createdAt: -1 }).limit(50).lean(),
      IdeaProjectModel.find({ ownerId: request.authUser.id, status: { $ne: 'archived' } }).sort({ updatedAt: -1 }).limit(50).lean(),
      MarketplaceRequestModel.find({ $or: [{ buyerUserId: request.authUser.id }, { sellerUserId: request.authUser.id }] }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);
    const requestData = marketplaceRequests.map((record) => ({ id: String(record._id), listingId: String(record.listingId), listingTitle: record.listingTitle, quantity: record.quantity, unitPriceInr: record.unitPricePaise / 100, message: record.message, status: record.status, createdAt: record.createdAt, role: record.buyerUserId === request.authUser!.id ? 'buyer' : 'seller', buyerEmail: record.sellerUserId === request.authUser!.id && record.status === 'accepted' ? record.buyerEmail : undefined, buyerPhone: record.sellerUserId === request.authUser!.id && record.status === 'accepted' ? record.buyerPhone : undefined }));
    const assessmentData = await Promise.all(assessments.map(async (record) => ({
      ...record,
      imageUrl: record.image?.storageKey ? await signedIdeaImageUrl(record.image.storageKey) : undefined,
    })));
    response.json({ data: { assessments: assessmentData, collectionRequests, ideas, purchases: [], marketplaceRequests: requestData }, error: null, meta: { persisted: true } });
  });
  app.get('/api/v1/passports/me', requireAuth);
  app.get('/api/v1/passports/:publicId', (_request, response) => {
    response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Passport not found.' }, meta: {} });
  });
  app.post('/api/v1/passports', requireAuth);

  app.use(notFound);
app.use(errorHandler);
