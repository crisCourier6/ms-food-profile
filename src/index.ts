import * as express from "express"
import * as bodyParser from "body-parser"
import { Request, Response } from "express"
import { AppDataSource } from "./data-source"
import { Routes } from "./routes"
import * as amqp from "amqplib/callback_api"
import { Channel } from "amqplib"
import { UserRatesFoodController } from "./controller/UserRatesFoodController"

AppDataSource.initialize().then(async () => {
    amqp.connect('amqps://zqjaujdb:XeTIDvKuWz8bHL5DHdJ9iq6e4CqkfqTh@gull.rmq.cloudamqp.com/zqjaujdb', (error0, connection) => {
        if(error0){
            throw error0
        }

        connection.createChannel((error1, channel)=>{
            if (error1){
                throw error1
            }
            const userRatesFoodController = new UserRatesFoodController
            channel.assertExchange("FoodProfile", "topic", {durable: false})

            channel.assertExchange("UserProfile", "topic", {durable: false})
            channel.assertExchange("Accounts", "topic", {durable: false})

            channel.assertQueue("FoodProfile_UserRatesFood", {durable: false})
            channel.bindQueue("FoodProfile_UserRatesFood", "UserProfile", "user-rates-food.*")

            channel.assertQueue("FoodProfile_Accounts", {durable: false})
            channel.bindQueue("FoodProfile_Accounts", "Accounts", "user.*")
          
            const app = express()
            app.use(bodyParser.json())
            var cors = require('cors');
            const corsOptions = {
                origin: 'http://192.168.100.6:4000',
                methods: ['POST', 'GET', 'PATCH', 'DELETE'],
                allowedHeaders: ['Content-Type', 'Authorization', "Access-Control-Allow-Origin", "cookies", "set-cookies"]
            }
            app.use(cors(corsOptions));

            // register express routes from defined application routes
            Routes.forEach(route => {
                (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {
                    const result = (new (route.controller as any))[route.action](req, res, next, channel)
                    if (result instanceof Promise) {
                        result.then(result => result !== null && result !== undefined ? res.send(result) : undefined)

                    } else if (result !== null && result !== undefined) {
                        res.json(result)
                    }
                })
            })

            channel.consume("FoodProfile_UserRatesFood", async (msg)=>{
                let action = msg.fields.routingKey.split(".")[1]
                let content = JSON.parse(msg.content.toString())
                if (action=="save"){
                    await userRatesFoodController.create(content)
                    .then(result=>{
                        console.log(result)
                    })
                }
                else if (action=="remove"){
                    await userRatesFoodController.remove(content.userId, content.foodLocalId)
                    .then(result=>{
                        console.log(result)
                    })
                }
            }, {noAck: true})

            channel.consume("FoodProfile_Accounts", async (msg)=>{
                let action = msg.fields.routingKey.split(".")[1]
                let content = JSON.parse(msg.content.toString())
                if (action=="save"){
                    console.log("i shouldn't do this")
                }
                else if (action=="remove"){
                    console.log("i should delete all rows with userId = ", content)
                    await userRatesFoodController.removeByUser(content)
                    .then(result=>{
                        console.log(result)
                    })
                }
            }, {noAck: true})

            // setup express app here
            // ...

            // start express server
            app.listen(3001)

            // insert new users for test

            console.log("Express server has started on port 3001. Open http://localhost:3001/foodlocal to see results")
            process.on("beforeExit", ()=>{
                console.log("closing")
                connection.close()
            })
        })
    })
    

}).catch(error => console.log(error))
