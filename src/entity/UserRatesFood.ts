import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm"
import { FoodLocal } from "./FoodLocal"

@Entity()
@Unique(["userId", "foodLocalId"])
export class UserRatesFood {

    @PrimaryColumn()
    userId: string

    @PrimaryColumn()
    foodLocalId: string

    @Column()
    rating: string

    @ManyToOne(()=>FoodLocal, foodLocal => foodLocal.userRatesFood, {onDelete: "CASCADE"})
    @JoinColumn({name: "foodLocalId"})
    foodLocal: FoodLocal
}