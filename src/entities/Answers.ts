import { Field, ObjectType } from "type-graphql";
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { AnswerUpvote } from "./AnswerUpvotes";
import { Comment } from "./Comments";
import { Question } from "./Questions";
import { User } from "./Users";

@ObjectType()
@Entity()
export class Answer extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    title!: string;

    @Field()
    @Column({ default: "" })
    main: string;

    @Field()
    @Column()
    content!: string;

    @Field()
    @Column({ default: "" })
    footer: string;

    @Field()
    @Column({ type: "int", default: 0 })
    votes!: number;

    @Field()
    @Column()
    creatorUsername: string;

    @Field()
    @Column()
    questionId: number;

    @Field(() => User)
    @ManyToOne(() => User, (user) => user.answers)
    creator: User;

    @Field(() => Question)
    @ManyToOne(() => Question, (question) => question.answers)
    question: Question;

    @Field(() => [AnswerUpvote])
    @OneToMany(() => AnswerUpvote, (answerUpvote) => answerUpvote.answer)
    answerUpvotes: AnswerUpvote[];

    @Field(() => [Comment])
    @OneToMany(() => Comment, (comment) => comment.answer)
    comments: Comment[];

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}
