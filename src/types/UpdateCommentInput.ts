import { Field, ID, InputType } from "type-graphql";

@InputType()
export class UpdateCommentInput {
	@Field((_type) => ID)
	id: number;

	@Field()
	text: string;
}
