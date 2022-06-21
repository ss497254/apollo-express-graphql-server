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
import { Answer } from "./Answers";
import { QuestionUpvote } from "./QuestionUpvotes";
import { User } from "./Users";

@ObjectType()
@Entity()
export class Question extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    id!: number;

    @Field()
    @Column()
    title!: string;

    @Field()
    @Column()
    text!: string;

    @Field()
    @Column({ type: "int", default: 0 })
    votes!: number;

    @Field()
    @Column({ type: "int", default: 0 })
    answerCount!: number;

    @Field()
    @Column()
    creatorUsername: string;

    @Field(() => User)
    @ManyToOne(() => User, (user) => user.questions)
    creator: User;

    @Field(() => [Answer], { nullable: true })
    @OneToMany(() => Answer, (answer) => answer.question)
    answers: Answer[];

    @Field(() => [QuestionUpvote], { nullable: true })
    @OneToMany(
        () => QuestionUpvote,
        (questionUpvote) => questionUpvote.question
    )
    questionUpvotes: QuestionUpvote[];

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
}
