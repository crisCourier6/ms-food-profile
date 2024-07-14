import { MainController } from "./controller/MainController"

export const Routes = [
    // food local
    {
        method: "get",
        route: "/foodlocal",
        controller: MainController,
        action: "foodLocalAll"
    }, 
    {
        method: "get",
        route: "/foodlocal/:id",
        controller: MainController,
        action: "foodLocalOne"
    }, 
    {
        method: "post",
        route: "/foodlocal/",
        controller: MainController,
        action: "foodLocalSaveLocal"
    }, 
    {
        method: "delete",
        route: "/foodlocal/:foodLocalId",
        controller: MainController,
        action: "foodLocalRemove"
    },
    // user rates food
    {
        method: "get",
        route: "/foodratings",
        controller: MainController,
        action: "userRatesFoodAll"
    }, 
    {
        method: "get",
        route: "/foodratings/byuserandfood/:foodLocalId/:userId",
        controller: MainController,
        action: "userRatesFoodOne"
    }, 
    {
        method: "get",
        route: "/foodratings/byuser/:userId",
        controller: MainController,
        action: "userRatesFoodAllByUser"
    }, 
    {
        method: "post",
        route: "/foodratings",
        controller: MainController,
        action: "userRatesFoodSave"
    }, 
    {
        method: "delete",
        route: "/foodratings/",
        controller: MainController,
        action: "userRatesFoodRemove"
    },
    {
        method: "delete",
        route: "/foodratings/byuser/:userId",
        controller: MainController,
        action: "userRatesFoodRemoveByUser"
    },
    {
        method: "delete",
        route: "/foodratings/byfood/:foodLocalId",
        controller: MainController,
        action: "userRatesFoodRemoveByFood"
    },
    {
        method: "get",
        route: "/foodratings/byfood/:foodLocalId",
        controller: MainController,
        action: "userRatesFoodRatingsByFood"
    }, 
    // open food facts
    {
        method: "get",
        route: "/foodexternal/:foodExternalId",
        controller: MainController,
        action: "foodExternalOne"
    }, 
]