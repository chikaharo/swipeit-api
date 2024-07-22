import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

@Entity()
export class Upvote extends BaseEntity {
	@PrimaryColumn()
	userId!: number;

	@ManyToOne((_to) => User, (user) => user.upvotes, { onDelete: "CASCADE" })
	user!: User;

	@PrimaryColumn()
	postId: number;

	@ManyToOne((_to) => Post, (post) => post.upvotes, { onDelete: "CASCADE" })
	post: Post;

	@Column()
	value!: number;
}
