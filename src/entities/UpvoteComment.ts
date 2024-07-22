import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./User";
import { Comment } from "./Comment";

@Entity()
export class UpvoteComment extends BaseEntity {
	@PrimaryColumn()
	userId!: number;

	@ManyToOne((_to) => User, (user) => user.upvotes, { onDelete: "CASCADE" })
	user!: User;

	@PrimaryColumn()
	commentId: number;

	@ManyToOne((_to) => Comment, (comment) => comment.upvotes, {
		onDelete: "CASCADE",
	})
	comment: Comment;

	@Column()
	value!: number;
}
