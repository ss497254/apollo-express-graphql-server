import { ObjectType, Field, Int } from "type-graphql";
import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryColumn,
} from "typeorm";
import { Answer } from "./Answers";
import { Question } from "./Questions";
import { User } from "./Users";

@ObjectType()
@Entity()
export class Bookmark extends BaseEntity {
    @PrimaryColumn()
    @OneToOne(() => User)
    @JoinColumn()
    user: User;

    @Field(() => Answer)
    @OneToMany(
        () => Answer,
        () => {
            onDelete: "CASCADE";
        }
    )
    answer: Answer[];

    @Field(() => Question)
    @OneToMany(
        () => Question,
        () => {
            onDelete: "CASCADE";
        }
    )
    question: Question[];
}
