import * as express from "express"
import * as bodyParser from "body-parser"
import { Request, Response } from "express"
import { AppDataSource } from "./data-source"
import { Routes } from "./routes"
import * as amqp from "amqplib/callback_api"
import { Channel } from "amqplib"
import { UserRatesFoodController } from "./controller/UserRatesFoodController"
import { AdditiveController } from "./controller/AdditiveController"
import { FoodLocalController } from "./controller/FoodLocalController"
import { FoodLocal } from "./entity/FoodLocal"

AppDataSource.initialize().then(async () => {
    amqp.connect(process.env.RABBITMQ_URL, (error0, connection) => {
        if(error0){
            throw error0
        }

        connection.createChannel((error1, channel)=>{
            if (error1){
                throw error1
            }
            const userRatesFoodController = new UserRatesFoodController
            const additiveController = new AdditiveController
            const foodLocalController = new FoodLocalController
            
            channel.assertExchange("FoodProfile", "topic", {durable: false})

            channel.assertExchange("UserProfile", "topic", {durable: false})
            channel.assertExchange("Accounts", "topic", {durable: false})
            channel.assertExchange("FoodEdit", "topic", {durable: false})

            channel.assertQueue("FoodProfile_UserRatesFood", {durable: false})
            channel.bindQueue("FoodProfile_UserRatesFood", "UserProfile", "user-rates-food.*")

            channel.assertQueue("FoodProfile_Accounts", {durable: false})
            channel.bindQueue("FoodProfile_Accounts", "Accounts", "user.*")

            channel.assertQueue("FoodProfile_FoodEdit", {durable: false})
            channel.bindQueue("FoodProfile_FoodEdit", "FoodEdit", "food-local.*")

            channel.assertQueue("FoodProfile_Additive", {durable: false})
            channel.bindQueue("FoodProfile_Additive", "FoodEdit", "additive.*")
          
            const app = express()
            app.use(bodyParser.json())
            var cors = require('cors');
            const corsOptions = {
                origin: ['http://192.168.100.6:4000', 'http://localhost:4000', 'http://192.168.100.6:5000', 'http://localhost:5000'],
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
                    await userRatesFoodController.saveAlt(content)
                    .then(result=>{
                        console.log(result)
                    })
                }
                else if (action=="removeOne"){
                    await userRatesFoodController.removeAlt(content.userId, content.foodLocalId)
                    .then(result=>{
                        console.log(result)
                    })
                }
                else if (action=="remove"){
                    console.log("i should delete all rows with userId = ", content)
                    await userRatesFoodController.removeByUser(content)
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

            channel.consume("FoodProfile_Additive", async (msg)=>{
                let action = msg.fields.routingKey.split(".")[1]
                let content = JSON.parse(msg.content.toString())
                if (action=="save"){
                    await additiveController.save(content)
                    .then(result => {
                        console.log(result)
                    })
                }
                else if (action=="update"){
                    await additiveController.update(content.id, content)
                    .then(result=>{
                        console.log(result)
                    })
                }
                else if (action=="remove"){
                    await additiveController.remove(content.id)
                    .then(result=>{
                        console.log(result)
                    })
                }
            }, {noAck: true})

            channel.consume("FoodProfile_FoodEdit", async (msg)=>{
                let action = msg.fields.routingKey.split(".")[1]
                let content = JSON.parse(msg.content.toString())
                if (action=="save"){
                    await foodLocalController.saveSimple(content as FoodLocal)
                    .then(result=>{
                        console.log(result)
                    })
                }
                else if (action === "new"){
                    await foodLocalController.saveSimple(content as FoodLocal)
                    .then(result=>{
                        console.log(result)
                    })
                }
            }, {noAck: true})

            // setup express app here

            // ******************* Poblado de la tabla de aditivos *****************
            
            // const additives = require('../additives.json')
            // const additiveRepo = AppDataSource.getRepository(Additive)
            // for (const [code, value] of Object.entries(additives)){
            //     let name = value["name"]["es"]?value["name"]["es"]:null
            //     let vegan = false
            //     let vegetarian = false
            //     if (value["vegan"] && value["vegan"]["en"]==="yes"){
            //         vegan = true
            //     }
            //     if (value["vegetarian"] && value["vegetarian"]["en"]==="yes"){
            //         vegetarian = true
            //     }
            //     let wikidata = value["wikidata"]?value["wikidata"]["en"]:null
            //     let newAdditive = {
            //         id: code,
            //         name: name,
            //         vegan: vegan,
            //         vegetarian: vegetarian,
            //         wikidata: wikidata
            //     }
            //     additiveRepo.save(newAdditive)
            // }

            // ******************* Poblado de la tabla de alérgenos *****************
            
            // const allergen = require('../allergen.json')
            // const allergenRepo = AppDataSource.getRepository(Allergen)
            // for (const [code, value] of Object.entries(allergen)){
            //     let name = value["name"]["es"]?value["name"]["es"]:value["name"]["en"]
            //     let wikidata = value["wikidata"]?value["wikidata"]["en"]:null
            //     let newAllergen = {
            //         id: code,
            //         name: name,
            //         wikidata: wikidata
            //     }
            //     allergenRepo.save(newAllergen)
            // }
            
            // start express server
            app.listen(process.env.PORT)

            // insert new users for test

            console.log(`Express server has started on port ${process.env.PORT}. Open http://localhost:${process.env.PORT}/foodlocal to see results`)
            process.on("beforeExit", ()=>{
                console.log("closing")
                connection.close()
            })
        })
    })
    

}).catch(error => console.log(error))
