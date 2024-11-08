import { MainController } from "./controller/MainController"

export const Routes = [
    // food local
    {
        method: "get",
        route: "/food/local",
        controller: MainController,
        action: "foodLocalAll"
    }, 
    {
        method: "get",
        route: "/food/local/:id",
        controller: MainController,
        action: "foodLocalOne"
    }, 
    {
        method: "post",
        route: "/food/local/",
        controller: MainController,
        action: "foodLocalSaveLocal"
    }, 
    {
        method: "delete",
        route: "/food/local/:foodLocalId",
        controller: MainController,
        action: "foodLocalRemove"
    },
    // user rates food
    {
        method: "get",
        route: "/food/ratings",
        controller: MainController,
        action: "userRatesFoodAll"
    }, 
    {
        method: "get",
        route: "/food/ratings/byuserandfood/:userId/:foodLocalId",
        controller: MainController,
        action: "userRatesFoodOne"
    }, 
    {
        method: "get",
        route: "/food/ratings/byuser/:userId",
        controller: MainController,
        action: "userRatesFoodAllByUser"
    }, 
    {
        method: "post",
        route: "/food/ratings",
        controller: MainController,
        action: "userRatesFoodSave"
    }, 
    {
        method: "delete",
        route: "/food/ratings/byuserandfood/:foodLocalId/:userId",
        controller: MainController,
        action: "userRatesFoodRemove"
    },
    {
        method: "delete",
        route: "/food/ratings/byuser/:userId",
        controller: MainController,
        action: "userRatesFoodRemoveByUser"
    },
    {
        method: "delete",
        route: "/food/ratings/byfood/:foodLocalId",
        controller: MainController,
        action: "userRatesFoodRemoveByFood"
    },
    {
        method: "get",
        route: "/food/ratings/byfood/:foodLocalId",
        controller: MainController,
        action: "userRatesFoodRatingsByFood"
    }, 
    // open food facts
    {
        method: "get",
        route: "/food/external/:id",
        controller: MainController,
        action: "foodExternalOne"
    }, 
    {
        method: "get",
        route: "/food/allergens",
        controller: MainController,
        action: "allergensAll"
    }, 
]