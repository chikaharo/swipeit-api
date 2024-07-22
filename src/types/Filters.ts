import { Field, InputType } from "type-graphql";

@InputType()
export class Filters {
	@Field({ nullable: true })
	createdAt?: SortDirection;

	@Field({ nullable: true })
	points?: SortDirection;
}

enum SortDirection {
	ASC = "ASC",
	DESC = "DESC",
}
