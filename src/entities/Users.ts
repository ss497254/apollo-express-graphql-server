import { ObjectType, Field } from "type-graphql";
import {
    Entity,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
    BaseEntity,
    OneToMany,
} from "typeorm";
import { Question } from "./Questions";
import { Answer } from "./Answers";
import { QuestionUpvote } from "./QuestionUpvotes";
import { AnswerUpvote } from "./AnswerUpvotes";
import { Comment } from "./Comments";

export enum Gender {
    "Male",
    "Female",
    "Gay",
    "Unspecified",
}

@ObjectType()
@Entity()
export class User extends BaseEntity {
    @Field()
    @PrimaryColumn()
    username!: string;

    @Field()
    @Column({ unique: true })
    email!: string;

    @Field()
    @Column({ default: "#" })
    avatarUrl!: string;

    @Column({ default: 0 })
    tokenVersion!: Number;

    @Field()
    @Column({ default: 0 })
    staff!: Number;

    @Field()
    @Column({
        type: "enum",
        enum: Gender,
        default: Gender.Unspecified,
    })
    gender!: Gender;

    @Column()
    password: string;

    @Field(() => [Answer], { nullable: true })
    @OneToMany(() => Answer, (answer) => answer.creator)
    answers: Answer[];

    @Field(() => [AnswerUpvote], { nullable: true })
    @OneToMany(() => AnswerUpvote, (answerUpvote) => answerUpvote.user)
    answerUpvotes: AnswerUpvote[];

    @Field(() => [Comment], { nullable: true })
    @OneToMany(() => Comment, (comment) => comment.user)
    comments: Comment[];

    @Field(() => [Question], { nullable: true })
    @OneToMany(() => Question, (question) => question.creator)
    questions: Question[];

    @Field(() => [QuestionUpvote], { nullable: true })
    @OneToMany(() => QuestionUpvote, (questionUpvote) => questionUpvote.user)
    questionUpvotes: QuestionUpvote[];

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}
