import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({
    limit: "16kb"
}))

app.use(express.urlencoded({
    extended: true, limit: "16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())

//router import 
import subscriptionRouter from './routes/subscription.routes.js';
import tweetRouter from "./routes/tweet.routes.js";
import userRouter from './routes/user.routes.js';

//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/subscription", subscriptionRouter)
app.use("/api/v1/tweet",tweetRouter)

export { app };
