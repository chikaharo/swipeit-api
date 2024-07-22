import { Field, ObjectType } from "type-graphql";
import { IMutationResponse } from "./MutationResponse";
import { FieldError } from "./FieldError";
import { Community } from "../entities/Community";

@ObjectType({ implements: IMutationResponse })
export class CommunityMutationResponse implements IMutationResponse {
	code: number;
	success: boolean;
	message?: string;

	@Field({ nullable: true })
	community?: Community;

	@Field((_type) => [FieldError], { nullable: true })
	errors?: FieldError[];
}
