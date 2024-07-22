import { Field, InputType } from "type-graphql";

@InputType()
export class CreateCommentInput {
	@Field()
	text: string;

	@Field()
	postId: number;

	@Field({ nullable: true })
	parentId?: number;
}
