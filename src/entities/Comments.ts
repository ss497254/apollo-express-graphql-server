import { ObjectType, Field } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Answer } from "./Answers";
import { User } from "./Users";

@ObjectType()
@Entity()
export class Comment extends BaseEntity {
    @Field()
    @Column()
    text: string;

    @Field()
    @PrimaryColumn()
    username: string;
    @ManyToOne(() => User, (user) => user.comments)
    user: User;

    @PrimaryColumn()
    answerId: number;

    @Field(() => Answer)
    @ManyToOne(() => Answer, (answer) => answer.comments, {
        onDelete: "CASCADE",
    })
    answer: Answer;
}
