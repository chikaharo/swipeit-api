import { Community } from "../entities/Community";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class PaginatedCommunities {
	@Field()
	totalCount!: number;

	@Field((_type) => Date)
	cursor!: Date;

	@Field()
	hasMore!: boolean;

	@Field((_type) => [Community])
	paginatedCommunities!: Community[];
}
