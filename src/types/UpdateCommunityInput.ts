import { Field, ID, InputType } from "type-graphql";

@InputType()
export class UpdateCommunityInput {
	@Field((_type) => ID)
	id: number;

	@Field()
	title: string;

	@Field()
	description: string;
}
