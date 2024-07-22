import { Field, ID, ObjectType } from "type-graphql";
import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Post } from "./Post";
import { UpvoteComment } from "./UpvoteComment";

@ObjectType()
@Entity()
export class Comment extends BaseEntity {
	@Field((_type) => ID)
	@PrimaryGeneratedColumn()
	id!: number;

	@Field()
	@Column()
	text!: string;

	@Field()
	@Column()
	userId!: number;

	@Field((_type) => User)
	@ManyToOne(() => User, (user) => user.comments, { onDelete: "CASCADE" })
	user: User;

	@Field()
	@Column()
	postId!: number;

	@Field((_type) => Post)
	@ManyToOne(() => Post, (post) => post.comments, {
		onDelete: "CASCADE",
	})
	post: Post;

	@Field((_type) => ID, { nullable: true })
	@Column({ nullable: true })
	parentId: number | null;

	// @Field((_type) => Comment)
	@ManyToOne(() => Comment, (comment) => comment.children, {
		onDelete: "CASCADE",
	})
	parent: Comment;

	@Field((_type) => [Comment])
	@OneToMany((_type) => Comment, (comment) => comment.parent)
	children!: Comment[];

	@OneToMany((_to) => UpvoteComment, (upvoteC) => upvoteC.comment)
	upvotes: UpvoteComment[];

	@Field()
	@Column({ default: 0 })
	points!: number;

	@Field()
	voteType!: number;

	@Field()
	@Column({ default: false })
	isSoftDeleted!: boolean;

	@Field()
	@CreateDateColumn({ type: "timestamptz" })
	createdAt: Date;

	@Field()
	@UpdateDateColumn({ type: "timestamptz" })
	updatedAt: Date;
}
