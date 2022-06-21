import { ObjectType, Field, Int } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Answer } from "./Answers";
import { User } from "./Users";

@ObjectType()
@Entity()
export class AnswerUpvote extends BaseEntity {
    @Field(() => Int)
    @Column({ type: "int" })
    value: number;

    @Field()
    @PrimaryColumn()
    username: string;

    @ManyToOne(() => User, (user) => user.answerUpvotes)
    user: User;

    @PrimaryColumn()
    answerId: number;

    @Field(() => Answer, { nullable: true })
    @ManyToOne(() => Answer, (answer) => answer.answerUpvotes, {
        onDelete: "CASCADE",
    })
    answer: Answer;
}
