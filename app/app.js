import express from "express";
import dbConnect from "../config/dbConnect.js";
import dotenv from "dotenv";
import userRoutes from "../routes/usersRoute.js";
import { globalErrhandler, notFound } from "../middlewares/globalErrHandler.js";
import productsRouter from "../routes/productsRoute.js";
import categoriesRouter from "../routes/categoriesRouter.js";
import brandsRouter from "../routes/brandsRouter.js";
import colorRouter from "../routes/colorRouter.js";
import reviewRouter from "../routes/reviewRouter.js";
import orderRouter from "../routes/ordersRouter.js";
import Stripe from "stripe";
import Order from "../model/Order.js";
import couponsRouter from "../routes/couponsRouter.js";
import cors from "cors";

dotenv.config();

//db connect
dbConnect();

const app = express();
//cors
app.use(cors());

//Stripe Webhook
// Stripe Instance
const stripe = new Stripe(process.env.STRIPE_KEY);

// This is the Stripe CLI webhook secret for testing endpoint locally.
const endpointSecret = "whsec_ff3a08491f84f28a0f6acf860d27bf63ddf8f381541bc87273a30f22878bf264";

app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
        console.log("event");
    } catch (err) {
        console.log('err', err.message);
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    if (event.type === "checkout.session.completed") {
        //update the order
        const session = event.data.object;
        const { orderId } = session.metadata;
        const paymentStatus = session.payment_status;
        const paymentMethod = session.payment_method_types[0];
        const totalAmount = session.amount_total;
        const currency = session.currency;
        console.log({
            orderId, paymentStatus, paymentMethod, totalAmount, currency
        });
        //find the order
        try {
            const order = await Order.findByIdAndUpdate(
                JSON.parse(orderId),
                {
                    totalPrice: totalAmount / 100,
                    currency,
                    paymentMethod,
                    paymentStatus,
                },
                {
                    new: true,
                }
            );
            console.log(order);
        } catch (error) {
            console.error('Error updating order:', error);
            response.status(500).send('Internal Server Error');
            return;
        }
    } else {
        return;
    }
    response.send();
});

//pass incoming data
app.use(express.json());
//routes
app.use("/api/v1/users/", userRoutes);
app.use("/api/v1/products/", productsRouter);
app.use("/api/v1/categories/", categoriesRouter);
app.use("/api/v1/brands/", brandsRouter);
app.use("/api/v1/colors/", colorRouter);
app.use("/api/v1/reviews/", reviewRouter);
app.use("/api/v1/orders/", orderRouter);
app.use("/api/v1/coupons/", couponsRouter);

//err middleware
app.use(notFound);
app.use(globalErrhandler);

export default app;
