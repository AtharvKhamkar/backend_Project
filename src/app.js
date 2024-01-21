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
import commentRouter from "./routes/comment.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from './routes/subscription.routes.js';
import tweetRouter from "./routes/tweet.routes.js";
import userRouter from './routes/user.routes.js';
import videoRouter from "./routes/video.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/subscription", subscriptionRouter)
app.use("/api/v1/tweet", tweetRouter)
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/comment", commentRouter)
app.use("/api/v1/playlist",playlistRouter)

export { app };
