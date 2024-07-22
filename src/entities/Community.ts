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

@ObjectType()
@Entity()
export class Community extends BaseEntity {
	@Field((_type) => ID)
	@PrimaryGeneratedColumn()
	id!: number;

	@Field()
	@Column()
	title!: string;

	@Field()
	@Column()
	description!: string;

	@Field((_type) => [Post], { nullable: true })
	@OneToMany(() => Post, (post) => post.community)
	posts!: Post[];

	@Field()
	@Column()
	userId!: number;

	@Field((_type) => User)
	@ManyToOne(() => User, (user) => user.posts)
	user: User;

	@Field()
	@CreateDateColumn({ type: "timestamptz" })
	createdAt: Date;

	@Field()
	@UpdateDateColumn({ type: "timestamptz" })
	updatedAt: Date;
}
