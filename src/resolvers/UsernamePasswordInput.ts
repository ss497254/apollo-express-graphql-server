import { InputType, Field, registerEnumType } from "type-graphql";
import { Gender } from "../entities/Users";

registerEnumType(Gender, {
    name: "Gender",
});

@InputType()
export class UsernamePasswordInput {
    @Field()
    email: string;
    @Field()
    username: string;
    @Field()
    password: string;
    @Field((_) => Gender, { nullable: true })
    gender: Gender;
    @Field({ nullable: true })
    avatarUrl: string;
}
