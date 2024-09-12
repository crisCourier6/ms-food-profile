import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm"
import { UserRatesFood } from "./UserRatesFood"

@Entity()
export class FoodLocal {

    @PrimaryColumn({unique: true})
    id: string

    @Column()
    name: string

    @Column({default: "defaultFood.png"})
    picture: string

    @Column({nullable: true})
    foodData: string

    @OneToMany(()=>UserRatesFood, userRatesFood=>userRatesFood.foodLocal)
    userRatesFood: UserRatesFood[]
}
