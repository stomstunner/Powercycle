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
import { analyseDeviceImage } from './services/aiAnalysis.js';
import { collectionRequestSchema } from './schemas/collection.js';
import { AssessmentModel } from './models/assessment.js';
import { CollectionRequestModel } from './models/collectionRequest.js';
import { IdeaProjectModel } from './models/ideaProject.js';
import { MarketplaceListingModel } from './models/marketplaceListing.js';
import { ideaProjectSchema, ideaStepSchema } from './schemas/ideaProject.js';
import { marketplaceListingSchema } from './schemas/marketplaceListing.js';
import { ideaImageUpload } from './middleware/upload.js';
import { marketplaceImageUpload } from './middleware/upload.js';
import { removeIdeaImage, signedIdeaImageUrl, storageConfigured, uploadIdeaImage, uploadMarketplaceImage } from './services/ideaStorage.js';
import mongoose from 'mongoose';

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
      ...listing,
      priceInr: listing.pricePaise / 100,
      images: await Promise.all(listing.images.map(async (image) => ({ ...image, url: await signedIdeaImageUrl(image.storageKey) }))),
    })));
    response.json({ data, error: null, meta: { persisted: true, count: data.length } });
  });

  app.get('/api/v1/marketplace/listings/me', requireAuth, async (request, response) => {
    if (!request.authUser || mongoose.connection.readyState !== 1) {
      response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Your marketplace listings are unavailable until database storage is configured.' }, meta: {} });
      return;
    }
    const listings = await MarketplaceListingModel.find({ sellerUserId: request.authUser.id, status: { $ne: 'removed' } }).sort({ createdAt: -1 }).lean();
    response.json({ data: listings, error: null, meta: { persisted: true, count: listings.length } });
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
        coverImage: { ...project.coverImage, url: await signedIdeaImageUrl(project.coverImage!.storageKey) },
        steps: await Promise.all(project.steps.map(async (step) => ({
          id: step.stepId,
          title: step.title,
          description: step.description,
          position: step.position,
          image: { ...step.image, url: await signedIdeaImageUrl(step.image!.storageKey) },
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

  app.get('/api/v1/ideas/:slug', async (request, response) => {
    if (mongoose.isValidObjectId(request.params.slug) && mongoose.connection.readyState === 1) {
      const project = await IdeaProjectModel.findOne({ _id: request.params.slug, status: 'published' }).lean();
      if (project && project.coverImage && project.steps.every((step) => Boolean(step.image))) {
        const coverUrl = await signedIdeaImageUrl(project.coverImage.storageKey);
        const steps = await Promise.all(project.steps.map(async (step) => ({ ...step, image: { ...step.image!, url: await signedIdeaImageUrl(step.image!.storageKey) } })));
        response.json({ data: { ...project, coverImage: { ...project.coverImage, url: coverUrl }, steps }, error: null, meta: {} });
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
    const [assessments, collections, publishedIdeas] = await Promise.all([
      AssessmentModel.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
      CollectionRequestModel.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
      IdeaProjectModel.find({ ownerId: userId, status: 'published' }).sort({ publishedAt: -1, createdAt: -1 }).limit(10).lean(),
    ]);
    const recommendations = assessments.reduce<Record<string, number>>((counts, item) => {
      counts[item.recommendation] = (counts[item.recommendation] ?? 0) + 1;
      return counts;
    }, { repair: 0, reuse: 0, upcycle: 0, recycle: 0 });
    const collectionRequests = collections.reduce<Record<string, number>>((counts, item) => {
      const key = item.status === 'under-review' ? 'underReview' : item.status;
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, { submitted: collections.length, underReview: 0, accepted: 0, completed: 0, rejected: 0 });
    const recentActivity = [
      ...assessments.map((item) => ({ id: String(item._id), type: 'assessment', title: `${item.deviceType} assessment`, createdAt: item.createdAt, status: item.recommendation, href: '/assess' })),
      ...publishedIdeas.map((item) => ({ id: String(item._id), type: 'idea', title: item.title, createdAt: item.publishedAt ?? item.createdAt, status: 'published', href: `/ideas/${item._id}` })),
      ...collections.map((item) => ({ id: String(item._id), type: 'collection', title: `${item.deviceCategory} collection request`, createdAt: item.createdAt, status: item.status, href: '/collection' })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
    response.json({
      data: {
        devicesAssessed: assessments.length,
        completedAssessments: assessments.length,
        secondLifeItems: 0,
        collectionRequests,
        verifiedEwasteKg: null,
        publishedIdeas: publishedIdeas.length,
        recommendations,
        recentActivity,
        dataQuality: { secondLifeItems: 'not_measured', verifiedEwasteKg: 'not_measured' },
      },
      error: null,
      meta: { persisted: true },
    });
  });

  app.post('/api/v1/assessments', requireAuth, validateBody(assessmentSchema), (request, response) => {
    const assessment = request.body;
    const result = recommendAssessment(assessment);
    if (mongoose.connection.readyState !== 1 || !request.authUser) {
      response.status(201).json({ data: result, error: null, meta: { persisted: false } });
      return;
    }
    void AssessmentModel.create({ ...assessment, ...result, userId: request.authUser.id })
      .then((saved) => response.status(201).json({ data: result, error: null, meta: { persisted: true, id: saved.id } }))
      .catch(() => response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Assessment was not saved. Please try again later.' }, meta: {} }));
  });

  app.get('/api/v1/ai/status', (_request, response) => {
    response.json({
      data: { configured: Boolean(env.GEMINI_API_KEY), model: env.GEMINI_MODEL.replace(/^models\//, '') },
      error: null,
      meta: {},
    });
  });

  app.post('/api/v1/ai/analyse-device', requireAuth, imageUpload.single('image'), async (request, response) => {
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
    const analysis = await analyseDeviceImage({ buffer: request.file.buffer, mimetype: request.file.mimetype }, details);
    response.status(200).json({ data: analysis, error: null, meta: { imageDiscarded: true } });
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
  app.get('/api/v1/activity/me', requireAuth, async (request, response) => {
    if (mongoose.connection.readyState !== 1 || !request.authUser) {
      response.status(503).json({ data: null, error: { code: 'PERSISTENCE_UNAVAILABLE', message: 'Activity history is unavailable until database storage is configured.' }, meta: {} });
      return;
    }
    const [assessments, collectionRequests, ideas] = await Promise.all([
      AssessmentModel.find({ userId: request.authUser.id }).sort({ createdAt: -1 }).limit(50).lean(),
      CollectionRequestModel.find({ userId: request.authUser.id }).sort({ createdAt: -1 }).limit(50).lean(),
      IdeaProjectModel.find({ ownerId: request.authUser.id, status: { $ne: 'archived' } }).sort({ updatedAt: -1 }).limit(50).lean(),
    ]);
    response.json({ data: { assessments, collectionRequests, ideas, purchases: [] }, error: null, meta: { persisted: true } });
  });
  app.get('/api/v1/passports/me', requireAuth);
  app.get('/api/v1/passports/:publicId', (_request, response) => {
    response.status(404).json({ data: null, error: { code: 'NOT_FOUND', message: 'Passport not found.' }, meta: {} });
  });
  app.post('/api/v1/passports', requireAuth);

  app.use(notFound);
app.use(errorHandler);
