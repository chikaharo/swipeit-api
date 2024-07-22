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
import { Upvote } from "./Upvote";
import { User } from "./User";
import { Community } from "./Community";
import { Comment } from "./Comment";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
	@Field((_type) => ID)
	@PrimaryGeneratedColumn()
	id!: number;

	@Field()
	@Column()
	title!: string;

	@Field()
	@Column()
	userId!: number;

	@Field((_type) => User)
	@ManyToOne(() => User, (user) => user.posts, { onDelete: "CASCADE" })
	user: User;

	@Field()
	@Column()
	communityId!: number;

	@Field((_type) => Community)
	@ManyToOne(() => Community, (community) => community.posts, {
		onDelete: "CASCADE",
	})
	community: Community;

	@OneToMany(() => Comment, (comment) => comment.post)
	comments: Comment[];

	@OneToMany((_to) => Upvote, (upvote) => upvote.post)
	upvotes: Upvote[];

	@Field()
	@Column({ default: 0 })
	points!: number;

	@Field()
	voteType!: number;

	@Field()
	@Column()
	text!: string;

	@Field()
	@CreateDateColumn({ type: "timestamptz" })
	createdAt: Date;

	@Field()
	@UpdateDateColumn({ type: "timestamptz" })
	updatedAt: Date;
}
