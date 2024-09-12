import { AppDataSource } from "../data-source"
import { NextFunction, Request, Response } from "express"
import { Additive } from "../entity/Additive"
import { In } from "typeorm"

export class AdditiveController {

    private additiveRepository = AppDataSource.getRepository(Additive)

    //all()
    // entradas:
    // salidas: Array con todas las filas de la tabla food_local
    async all(res: Response) {
        return this.additiveRepository.find()
    }
    //one(id: string)
    // entradas: id: id del alimento que se quiere encontrar
    // salidas: undefined - si es que no se encuentra el alimento
    //          foodlocal - alimento 
    async one(id: string, res: Response) {
        const additive = await this.additiveRepository.findOne({
            where: { id: id }
        })

        if (!additive) {
            return undefined
        }
        return additive
    }
    //getAllByIds(ids:any)
    // entradas: ids: Array con id de alimentos que se quieren encontrar
    // salidas: undefined - si es que no se encuentran alimentos
    //          additives - Array de alimentos
    async getAllbyIds(userRejectsRows: any, res: Response){
        let idList = []
        for (var row of userRejectsRows){
            idList.push(row.additiveId)
        }
        const additives = await this.additiveRepository.find({where: {id: In(idList)}})
        if (!additives){
            return undefined
        }
        return additives
    }
    //saveLocal(food:any)
    // entradas: food: objeto con la forma de Additive que se quiere agregar al repositorio
    // salidas: undefined - si es que no se puede agregar food al repositorio
    //          createdAdditive - registro agregado al repositorio
    async save(additive: any) {

       const createdAdditive = await this.additiveRepository.save(additive) // si food.id ya existe en la tabla, save actualiza
       if (createdAdditive){                                             // el registro con los otros campos de food 
           return createdAdditive
       }
       return undefined
   }
    //update(id: any, food: any)
    // entradas: id: código de barras del alimento que se quiere actualizar
    //           food: objeto con la forma de Additive
    // salidas: undefined - si es que no se puede agregar food al repositorio
    //          updatedAdditive - registro actualizad
    // ************* save puede cumplir el mismo rol de esta función ***********************************
    // ***** pero update recibe un objeto Additive, save recibe un objeto desde OpenFoodFacts *********
    async update(id: any, additive: any) {
        const updatedAdditive = await this.additiveRepository.update(id, additive)
        if (updatedAdditive){
            return updatedAdditive
        }
        return undefined
        
    }
    // remove(id: string)
    // entradas: id: código de barras del alimento que se quiere eliminar
    // salidas: undefined - si es que no existe el alimento 
    //          removedFood - registro eliminado
    async remove(id: string) {
        let additiveToRemove = await this.additiveRepository.findOneBy({ id: id })

        if (!additiveToRemove) {
            return undefined
        }

        const removedAdditive = await this.additiveRepository.remove(additiveToRemove)

        return removedAdditive
    }

}