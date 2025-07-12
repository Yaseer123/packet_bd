import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { addressRouter } from "./routers/address";
import { blogPostRouter } from "./routers/blogPost";
import { categoryRouter } from "./routers/category";
import { contactRouter } from "./routers/contact";
import { couponRouter } from "./routers/coupon";
import { faqRouter } from "./routers/faq";
import { newsletterRouter } from "./routers/newsletter";
import { orderRouter } from "./routers/order";
import { productRouter } from "./routers/product";
import { questionRouter } from "./routers/question";
import { reviewRouter } from "./routers/review";
import { saleBannerRouter } from "./routers/saleBanner";
import { sliderRouter } from "./routers/slider";
import { userRouter } from "./routers/user";
import { wishListRouter } from "./routers/wishList";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  category: categoryRouter,
  product: productRouter,
  post: blogPostRouter,
  order: orderRouter,
  question: questionRouter,
  wishList: wishListRouter,
  address: addressRouter,
  faq: faqRouter,
  slider: sliderRouter,
  saleBanner: saleBannerRouter,
  contact: contactRouter,
  review: reviewRouter,
  newsletter: newsletterRouter,
  coupon: couponRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
