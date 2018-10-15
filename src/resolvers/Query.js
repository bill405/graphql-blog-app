import getUserId from '../utils/getUserId'

const Query = {
    users(parent, args, { prisma }, info) {
        const opArgs = {
            first: args.first, 
            skip: args.skip,
            after: args.after,
            orderBy: args.orderBy
        }

        if (args.query) {
            opArgs.where = {
                OR: [{
                    name_contains: args.query
                }]
            } 
        }
        return prisma.query.users(opArgs, info)
    },
    async myPosts(parent, {query, first, skip, after, orderBy}, {prisma, request}, info) {
        const userId = getUserId(request)
        
        const opArgs = {
            where: {
                author: {
                    id: userId
                }
            },
            first,
            skip,
            after,
            orderBy
        }
        
        if (query) {
            opArgs.where.OR = 
            [
                {title_contains: query},
                {body_contains: query}
            ]    
        }
        
        return prisma.query.posts(opArgs, info)
    },
    posts(parent, {query, first, skip, after, orderBy}, { prisma }, info) {

        const opArgs = {
            where: {
                published: true
            },
            first,
            skip,
            after,
            orderBy
        }

        if (query) {
            opArgs.where.OR = 
            [
                {title_contains: query},
                {body_contains: query}
            ]    
        }

        return prisma.query.posts(opArgs, info)
    },
    comments(parent, {first, skip, after, orderBy}, { prisma }, info) {
        const opArgs = {
            first,
            skip,
            after,
            orderBy
        }

        return prisma.query.comments(opArgs, info)
    },
    async me(parents, args, {prisma, request}, info) {
        const userId = getUserId(request)

        const [me] = await prisma.query.users({
            where: {
                id: userId
            },
            first,
            skip,
            after
        })
        
        return me
    },
    async post(parents, args, { prisma, request }, info) {
        const userId = getUserId(request, false)
        
        const [post] = await prisma.query.posts({
            where: {
                id: args.id,
                OR: [
                    {published: true},
                    {author: 
                        {
                            id: userId
                        }
                    }
                ]
            }
        }, info)

        if (posts.length === 0) {
            throw new Error('Post not found')
        }

        return post
    }
}

export { Query as default }