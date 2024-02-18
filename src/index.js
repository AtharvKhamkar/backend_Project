import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from './db/index.js';
import postmanToOpenApi from "postman-to-openapi";
import path from "path"
import YAML from "yamljs";
import swaggerUi from "swagger-ui-express"
import { response } from "express";



dotenv.config({
    path: './env'
})

postmanToOpenApi(
    "postman/Backend_Project.postman_collection.json",
    path.join("postman/swagger.yml"),
    {defaultTag:"General"}
).then((response) => {
    let result = YAML.load("postman/swagger.yml");
    result.servers[0].url = "/";
    app.use("/swagger",swaggerUi.serve,swaggerUi.setup(result))
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 6000, () => {
        console.group(`Server is running at port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MongoDB connection failed!!!",err)
})