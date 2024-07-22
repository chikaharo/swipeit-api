import { Field, ObjectType } from "type-graphql";
import { IMutationResponse } from "./MutationResponse";
import { FieldError } from "./FieldError";
import { Comment } from "../entities/Comment";

@ObjectType({ implements: IMutationResponse })
export class CommentMutationResponse implements IMutationResponse {
	code: number;
	success: boolean;
	message?: string;

	@Field({ nullable: true })
	comment?: Comment;

	@Field((_type) => [FieldError], { nullable: true })
	errors?: FieldError[];
}
