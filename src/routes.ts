import { MainController } from "./controller/MainController"

export const Routes = [
    // food local
    {
        method: "get",
        route: "/api/v1/food/local",
        controller: MainController,
        action: "foodLocalAll"
    }, 
    {
        method: "get",
        route: "/api/v1/food/local/:id",
        controller: MainController,
        action: "foodLocalOne"
    }, 
    {
        method: "post",
        route: "/api/v1/food/local/",
        controller: MainController,
        action: "foodLocalSaveLocal"
    }, 
    {
        method: "delete",
        route: "/api/v1/food/local/:foodLocalId",
        controller: MainController,
        action: "foodLocalRemove"
    },
    // user rates food
    {
        method: "get",
        route: "/api/v1/food/ratings",
        controller: MainController,
        action: "userRatesFoodAll"
    }, 
    {
        method: "get",
        route: "/api/v1/food/ratings/byuserandfood/:userId/:foodLocalId",
        controller: MainController,
        action: "userRatesFoodOne"
    }, 
    {
        method: "get",
        route: "/api/v1/food/ratings/byuser/:userId",
        controller: MainController,
        action: "userRatesFoodAllByUser"
    }, 
    {
        method: "post",
        route: "/api/v1/food/ratings",
        controller: MainController,
        action: "userRatesFoodSave"
    }, 
    {
        method: "delete",
        route: "/api/v1/food/ratings/byuserandfood/:foodLocalId/:userId",
        controller: MainController,
        action: "userRatesFoodRemove"
    },
    {
        method: "delete",
        route: "/api/v1/food/ratings/byuser/:userId",
        controller: MainController,
        action: "userRatesFoodRemoveByUser"
    },
    {
        method: "delete",
        route: "/api/v1/food/ratings/byfood/:foodLocalId",
        controller: MainController,
        action: "userRatesFoodRemoveByFood"
    },
    {
        method: "get",
        route: "/api/v1/food/ratings/byfood/:foodLocalId",
        controller: MainController,
        action: "userRatesFoodRatingsByFood"
    }, 
    // open food facts
    {
        method: "get",
        route: "/api/v1/food/external/:id",
        controller: MainController,
        action: "foodExternalOne"
    }, 
    {
        method: "get",
        route: "/api/v1/food/allergens",
        controller: MainController,
        action: "allergensAll"
    }, 
]