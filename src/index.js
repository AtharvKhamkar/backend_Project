import dotenv from "dotenv";
import path from "path";
import postmanToOpenApi from "postman-to-openapi";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { app } from "./app.js";
import connectDB from './db/index.js';





dotenv.config({
    path: './env'
})

postmanToOpenApi(
    "postman/Backend_Project(Server).postman_collection.json",
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