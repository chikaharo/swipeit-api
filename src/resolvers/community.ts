import {
	Arg,
	Ctx,
	FieldResolver,
	ID,
	Int,
	Mutation,
	Query,
	Resolver,
	Root,
	UseMiddleware,
} from "type-graphql";
import { Post } from "../entities/Post";
import { CommunityMutationResponse } from "../types/CommunityMutationResponse";
import { checkAuth } from "../middleware/checkAuth";
import { User } from "../entities/User";
import { Context } from "../types/Context";
import { Community } from "../entities/Community";
import { CreateCommunityInput } from "../types/CreateCommunityInput";
import { UpdateCommunityInput } from "../types/UpdateCommunityInput";
import { PaginatedCommunities } from "../types/PaginatedCommunities";
import { LessThan, Like } from "typeorm";

@Resolver((_of) => Community)
export class CommunityResolver {
	// @FieldResolver((_return) => String)
	// textSnippet(@Root() root: Community) {
	// 	return root.text.slice(0, 50);
	// }

	@FieldResolver((_return) => User)
	async user(
		@Root() root: Community,
		@Ctx() { dataLoaders: { userLoader } }: Context
	) {
		// return await User.findOne(root.userId)
		return await userLoader.load(root.userId);
	}

	@FieldResolver((_return) => User)
	async posts(
		@Root() root: Community
		// @Ctx() { dataLoaders: { userLoader } }: Context
	) {
		return await Post.find({ where: { communityId: root.id } });
		// return await userLoader.load(root.userId);
	}

	@Mutation((_return) => CommunityMutationResponse)
	@UseMiddleware(checkAuth)
	async createCommunity(
		@Arg("createCommunityInput") { title, description }: CreateCommunityInput,
		@Ctx() { req }: Context
	): Promise<CommunityMutationResponse> {
		try {
			const newCommunity = Community.create({
				title: title.toLowerCase(),
				description,
				userId: req.session.userId,
				posts: [],
			});

			await newCommunity.save();

			return {
				code: 200,
				success: true,
				message: "Post created successfully",
				community: newCommunity,
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

	@Query((_return) => PaginatedCommunities, { nullable: true })
	async communities(
		@Arg("limit", (_type) => Int) limit: number,
		@Arg("cursor", { nullable: true }) cursor?: string,
		@Arg("title", { nullable: true }) title?: string
	): Promise<PaginatedCommunities | null> {
		try {
			const totalCommunitiesCount = (await Community.find()).length;
			const realLimit = Math.min(10, limit);

			const findOptions: { [key: string]: any } = {
				order: {
					createdAt: "DESC",
				},
				take: realLimit,
			};

			if (title) {
				findOptions.where = {
					title: Like(`%${title}%`),
				};
			}

			let lastCommunity: Community[] = [];
			if (cursor) {
				findOptions.where = { createdAt: LessThan(cursor) };

				lastCommunity = await Community.find({
					order: { createdAt: "ASC" },
					...(title
						? {
								where: {
									title: Like(`%${title}%`),
								},
						  }
						: {}),
					take: 1,
				});
			}

			const communities = await Community.find(findOptions);

			let hasMore = false;
			if (cursor) {
				if (lastCommunity && communities.length) {
					hasMore =
						communities[communities.length - 1]?.createdAt.toString() !==
						lastCommunity[0]?.createdAt.toString();
				}
			} else {
				hasMore = communities.length !== totalCommunitiesCount;
			}

			return {
				totalCount: totalCommunitiesCount,
				cursor: communities.length
					? communities[communities.length - 1].createdAt
					: new Date(),
				hasMore,
				paginatedCommunities: communities,
			};
		} catch (error) {
			console.log(error);
			return null;
		}
	}

	// @Query((_return) => [Community], { nullable: true })
	// async communities(): Promise<Community[]> {
	// 	try {
	// 		const totlCoummintyCount = await Community.count();
	// 		const realLimit = Math.min(10, limit);

	// 		const findOptions: { [key: string]: any } = {
	// 			order: {
	// 				createdAt: "DESC",
	// 			},
	// 			take: realLi,
	// 		};

	// 		// let lastPost: Post[] = []
	// 		// if (cursor) {
	// 		// 	findOptions.where = { createdAt: LessThan(cursor) }

	// 		// 	lastPost = await Post.find({ order: { createdAt: 'ASC' }, take: 1 })
	// 		// }

	// 		const communities = await Community.find(findOptions);

	// 		// return {
	// 		// 	totalCount: totalPostCount,
	// 		// 	cursor: posts[posts.length - 1].createdAt,
	// 		// 	hasMore: cursor
	// 		// 		? posts[posts.length - 1].createdAt.toString() !==
	// 		// 		  lastPost[0].createdAt.toString()
	// 		// 		: posts.length !== totalPostCount,
	// 		// 	paginatedPosts: posts
	// 		// }
	// 		return communities;
	// 	} catch (error) {
	// 		console.log(error);
	// 		return [];
	// 	}
	// }

	@Query((_return) => Community, { nullable: true })
	async community(
		@Arg("id", (_type) => ID) id: number
	): Promise<Community | undefined> {
		try {
			const community = await Community.findOne(id);
			return community;
		} catch (error) {
			console.log(error);
			return undefined;
		}
	}

	@Mutation((_return) => CommunityMutationResponse)
	@UseMiddleware(checkAuth)
	async updateCommunity(
		@Arg("updateCommunityInput")
		{ id, title, description }: UpdateCommunityInput,
		@Ctx() { req }: Context
	): Promise<CommunityMutationResponse> {
		const existingCommunity = await Community.findOne(id);
		if (!existingCommunity)
			return {
				code: 400,
				success: false,
				message: "Community not found",
			};

		if (existingCommunity.userId !== req.session.userId) {
			return { code: 401, success: false, message: "Unauthorised" };
		}

		existingCommunity.title = title;
		existingCommunity.description = description;

		await existingCommunity.save();

		return {
			code: 200,
			success: true,
			message: "Post updated successfully",
			community: existingCommunity,
		};
	}

	@Mutation((_return) => CommunityMutationResponse)
	@UseMiddleware(checkAuth)
	async deleteCommunity(
		@Arg("id", (_type) => ID) id: number,
		@Ctx() { req }: Context
	): Promise<CommunityMutationResponse> {
		const existingCommunity = await Community.findOne(id);
		if (!existingCommunity)
			return {
				code: 400,
				success: false,
				message: "Community not found",
			};

		if (existingCommunity.userId !== req.session.userId) {
			return { code: 401, success: false, message: "Unauthorised" };
		}

		await Community.delete({ id });

		return {
			code: 200,
			success: true,
			message: "Community deleted successfully",
		};
	}
}
