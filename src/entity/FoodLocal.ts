import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm"
import { UserRatesFood } from "./UserRatesFood"
import { FoodHasAllergen } from "./FoodHasAllergen"
import { FoodHasAdditive } from "./FoodHasAdditive"

@Entity()
export class FoodLocal {

    @PrimaryColumn({unique: true})
    id: string

    @Column({default: "Sin nombre"})
    name: string

    @Column({default: "defaultFood.png"})
    picture: string

    @Column({default: false})
    hasLocalAllergens: boolean

    @Column({default: false})
    hasLocalAdditives: boolean

    @Column({type: "jsonb", nullable: true})
    foodData: any

    @OneToMany(()=>UserRatesFood, userRatesFood=>userRatesFood.foodLocal)
    userRatesFood: UserRatesFood[]

    @OneToMany(()=>FoodHasAllergen, foodHasAllergen=>foodHasAllergen.foodLocal)
    foodHasAllergen: FoodHasAllergen[]

    @OneToMany(()=>FoodHasAdditive, foodHasAdditive=>foodHasAdditive.foodLocal)
    foodHasAdditive: FoodHasAdditive[]

    likes: number
    dislikes: number
    userRating: string | null
}
