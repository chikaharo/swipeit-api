import { Field, InputType } from "type-graphql";

@InputType()
export class CreateCommunityInput {
	@Field()
	title: string;

	@Field()
	description: string;
}
