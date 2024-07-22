import {
	Arg,
	Ctx,
	FieldResolver,
	ID,
	Int,
	Mutation,
	Query,
	registerEnumType,
	Resolver,
	Root,
	UseMiddleware,
} from "type-graphql";
import { CommentMutationResponse } from "../types/CommentMutationResponse";
import { checkAuth } from "../middleware/checkAuth";
import { User } from "../entities/User";
import { Context } from "../types/Context";
import { VoteType } from "../types/VoteType";
import { UserInputError } from "apollo-server-core";
import { Comment } from "../entities/Comment";
import { CreateCommentInput } from "../types/CreateCommentInput";
import { PaginatedComments } from "../types/PaginatedComments";
import { UpdateCommentInput } from "../types/UpdateCommentInput";
import { UpvoteComment } from "../entities/UpvoteComment";
import { LessThan } from "typeorm";

registerEnumType(VoteType, {
	name: "VoteType", // this one is mandatory
});

@Resolver((_of) => Comment)
export class CommentResolver {
	@FieldResolver((_return) => String)
	textSnippet(@Root() root: Comment) {
		return root.text.slice(0, 50);
	}
	@FieldResolver((_return) => [Comment])
	async children(@Root() root: Comment): Promise<Comment[]> {
		return await Comment.find({
			where: { parentId: root.id },
		});
	}

	@FieldResolver((_return) => User)
	async user(
		@Root() root: Comment,
		@Ctx() { dataLoaders: { userLoader } }: Context
	) {
		// return await User.findOne(root.userId)
		return await userLoader.load(root.userId);
	}

	@FieldResolver((_return) => Int)
	async voteType(
		@Root() root: Comment,
		@Ctx() { req, dataLoaders: { voteCommentTypeLoader } }: Context
	) {
		if (!req.session.userId) return 0;

		const existingVote = await voteCommentTypeLoader.load({
			commentId: root.id,
			userId: req.session.userId,
		});

		return existingVote ? existingVote.value : 0;
	}

	@Mutation((_return) => CommentMutationResponse)
	@UseMiddleware(checkAuth)
	async createComment(
		@Arg("createCommentInput") { text, postId, parentId }: CreateCommentInput,
		@Ctx() { req }: Context
	): Promise<CommentMutationResponse> {
		try {
			if (parentId) {
				const parentComment = await Comment.findOne(parentId);
				if (
					!parentComment ||
					parentComment.postId.toString() !== postId.toString()
				) {
					return {
						code: 400,
						success: false,
						message: "Parent comment invalid",
					};
				}
			}
			const newComment = Comment.create({
				text,
				userId: req.session.userId,
				postId: postId,
				children: [],
				...(parentId ? { parentId } : { parentId: null }),
			});

			await newComment.save();

			return {
				code: 200,
				success: true,
				message: "Comment created successfully",
				comment: newComment,
			};
		} catch (error) {
			console.log(error);
			return {
				code: 500,
				success: false,
				message: `Internal server error ${error.message}`,
			};
		}
	}

	@Query((_return) => PaginatedComments, { nullable: true })
	async comments(
		@Arg("limit", (_type) => Int) limit: number,
		@Arg("postId", (_type) => ID!) postId: number,
		@Arg("cursor", { nullable: true }) cursor?: string
	): Promise<PaginatedComments | null> {
		try {
			const totalCommentsCount = (await Comment.find({ where: { postId } }))
				.length;
			const realLimit = Math.min(10, limit);

			const findOptions: { [key: string]: any } = {
				order: {
					createdAt: "DESC",
				},
				where: {
					postId,
				},
				take: realLimit,
			};

			let lastComment: Comment[] = [];
			if (cursor) {
				findOptions.where = { createdAt: LessThan(cursor) };

				lastComment = await Comment.find({
					order: { createdAt: "ASC" },
					where: {
						postId,
					},
					take: 1,
				});
			}

			const comments = await Comment.find(findOptions);

			console.log("comment length: ", comments.length);
			console.log({ totalCommentsCount });
			console.log({ lastComment });

			let hasMore = false;
			if (cursor) {
				if (lastComment && comments.length) {
					hasMore =
						comments[comments.length - 1]?.createdAt.toString() !==
						lastComment[0]?.createdAt.toString();
				}
			} else {
				hasMore = comments.length !== totalCommentsCount;
			}

			return {
				totalCount: totalCommentsCount,
				cursor: comments.length
					? comments[comments.length - 1].createdAt
					: new Date(),
				hasMore,
				paginatedComments: comments,
			};
		} catch (error) {
			console.log(error);
			return null;
		}
	}

	@Query((_return) => Comment, { nullable: true })
	async comment(
		@Arg("id", (_type) => ID) id: number
	): Promise<Comment | undefined> {
		try {
			const comment = await Comment.findOne(id);
			return comment;
		} catch (error) {
			console.log(error);
			return undefined;
		}
	}

	@Mutation((_return) => CommentMutationResponse)
	@UseMiddleware(checkAuth)
	async updateComment(
		@Arg("updateCommentInput") { id, text }: UpdateCommentInput,
		@Ctx() { req }: Context
	): Promise<CommentMutationResponse> {
		const existingComment = await Comment.findOne(id);
		if (!existingComment)
			return {
				code: 400,
				success: false,
				message: "Comment not found",
			};

		if (existingComment.userId !== req.session.userId) {
			return { code: 401, success: false, message: "Unauthorised" };
		}

		existingComment.text = text;

		await existingComment.save();

		return {
			code: 200,
			success: true,
			message: "Comment updated successfully",
			comment: existingComment,
		};
	}

	@Mutation((_return) => CommentMutationResponse)
	@UseMiddleware(checkAuth)
	async deleteComment(
		@Arg("id", (_type) => ID) id: number,
		@Ctx() { req }: Context
	): Promise<CommentMutationResponse> {
		const existingComment = await Comment.findOne(id);
		if (!existingComment)
			return {
				code: 400,
				success: false,
				message: "Comment not found",
			};

		if (existingComment.userId !== req.session.userId) {
			return { code: 401, success: false, message: "Unauthorised" };
		}

		await UpvoteComment.delete({ commentId: id });
		// await Post.delete({ communityId: id });
		// await Comment.delete({ id });
		existingComment.text = "(This message was deleted)";
		existingComment.isSoftDeleted = true;
		await existingComment.save();

		return {
			code: 200,
			success: true,
			message: "Comment deleted successfully",
		};
	}

	@Mutation((_return) => CommentMutationResponse)
	@UseMiddleware(checkAuth)
	async voteComment(
		@Arg("commentId", (_type) => Int) commentId: number,
		@Arg("inputVoteValue", (_type) => VoteType) inputVoteValue: VoteType,
		@Ctx()
		{
			req: {
				session: { userId },
			},
			connection,
		}: Context
	): Promise<CommentMutationResponse> {
		return await connection.transaction(async (transactionEntityManager) => {
			let comment = await transactionEntityManager.findOne(Comment, commentId);
			if (!comment) {
				throw new UserInputError("Comment not found");
			}

			// check if user has voted or not
			const existingVote = await transactionEntityManager.findOne(
				UpvoteComment,
				{
					commentId,
					userId,
				}
			);

			if (existingVote && existingVote.value !== inputVoteValue) {
				await transactionEntityManager.save(UpvoteComment, {
					...existingVote,
					value: inputVoteValue,
				});

				comment = await transactionEntityManager.save(Comment, {
					...comment,
					points: comment.points + 2 * inputVoteValue,
				});
			}

			if (!existingVote) {
				const newVote = transactionEntityManager.create(UpvoteComment, {
					userId,
					commentId,
					value: inputVoteValue,
				});
				await transactionEntityManager.save(newVote);

				comment.points = comment.points + inputVoteValue;
				comment = await transactionEntityManager.save(comment);
			}

			return {
				code: 200,
				success: true,
				message: "Comment voted",
				comment,
			};
		});
	}
}
