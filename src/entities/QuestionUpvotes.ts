import { ObjectType, Field, Int } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Question } from "./Questions";
import { User } from "./Users";

// m to n
// many to many
// user <-> posts
// user -> join table <- posts
// user -> updoot <- posts

@ObjectType()
@Entity()
export class QuestionUpvote extends BaseEntity {
    @Field(() => Int)
    @Column({ type: "int" })
    value: number;

    @Field()
    @PrimaryColumn()
    username: string;

    @ManyToOne(() => User, (user) => user.questionUpvotes)
    user: User;

    @PrimaryColumn()
    questionId: number;

    @Field(() => Question, { nullable: true })
    @ManyToOne(() => Question, (question) => question.questionUpvotes, {
        onDelete: "CASCADE",
    })
    question: Question;
}
