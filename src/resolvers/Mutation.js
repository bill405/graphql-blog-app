import bcrypt from 'bcryptjs';
import hashPassword from '../utils/hashPassword'
import getUserId from '../utils/getUserId';
import generateToken from '../utils/generateToken';

const Mutation = {
    async createUser(parent, args, { prisma }, info) {
        const password =  await hashPassword(args.data.password)
        const user = await prisma.mutation.createUser({
            data: {
                ...args.data,
                password
            }
        })
     
        return {
            user,
            token: generateToken(user.id)
        }
    },

    async loginUser(parent, args, { prisma }, info ) {
        const user = await prisma.query.user({
            where: {
                email: args.data.email
            }
        })

        if(!user) {
            throw new Error('Unable to login')
        }

        const passwordCorrect = await bcrypt.compare(args.data.password, user.password)

        if (!passwordCorrect) {
            throw new Error('Unable to login')
        }

        return {
            user, 
            token: generateToken(user.id)
        }
    },
    
    async deleteUser(parent, args, { prisma, request }, info) {
        const userId = getUserId(request);

        return prisma.mutation.deleteUser({
            where: {
                id: userId  
            } 
        }, info)
    },
    async updateUser(parent, args, { prisma, request }, info) {
        const userId = getUserId(request);
        
        if (typeof args.data.password === 'string') {
            args.data.password = await hashPassword(args.data.password)
        }

        return prisma.mutation.updateUser({
            data: args.data,
            where: {
                id: userId
            }
        }, info)
    },
    async createPost(parent, args, { prisma, request}, info) {
        const userId = getUserId(request);

       return prisma.mutation.createPost({
        data: {
            title: args.data.title,
            body: args.data.body,
            published: args.data.published,
            author: {
                connect: {
                   id: userId
                }
            }
        }
       }, info)
    },
    async deletePost(parent, args, { prisma, request }, info) {
        const userId = getUserId(request);
        const postExists = await prisma.exists.Post({
            id: args.id, 
            author: {
                id: userId
            }
        })

        if(!postExists) {
            throw new Error('Operation failed')
        }

        return prisma.mutation.deletePost({
            where: {
                id: args.id
            }
        }, info)
    },
    async updatePost(parent, args, { prisma, request }, info) {
        const userId = getUserId(request);
        
        const postExists = await prisma.exists.Post({
            id: args.id, 
            author: {
                id: userId
            }
        })
        const isPublished = await prisma.exists.Post({id: args.id, published: true})

        if( !postExists) {
            throw new Error('Operation failed')
        }

        if (isPublished && args.data.published === true) {
            await prisma.mutation.deleteManyComments({
                where: {
                    post: {
                        id: args.id
                    }
                }
            })
        }

        return prisma.mutation.updatePost({
            data: args.data,
            where: {
                id: args.id
            } 
        }, info)
        },
    async createComment(parent, args, { prisma, request }, info) {
        const userId = getUserId(request)

        const postPublished = await prisma.exists.Post({
            id: args.data.id,
            published: true
        })

        if (!postPublished) {
            throw new Error('Something went wrong')
        }
        
        return prisma.mutation.createComment({
                data: {
                    text: args.data.text,
                    author: {
                        connect: {
                            id: userId
                        }
                    },
                    post: {
                        connect: {
                            id: args.data.post
                        }
                    }
                }
        }, info)
    },
    async deleteComment(parent, args, { prisma, request }, info) {
        const userId = getUserId(request);
        
        //checks that the comment exists and the author is the right author of the comment
        const commentExists = await prisma.exists.Comment({
            id: args.id, 
            author: {
                id: userId
            }
        })

        if(!commentExists) {
            throw new Error(`args.id is ${args.id} and author id is ${userId} and ${commentExists}`)
        }

        return prisma.mutation.deleteComment({
            where: {
                id: args.id
            }
        }, info)
    },
   async updateComment(parent, args, { prisma, request }, info) {
    const userId = getUserId(request);
        
        //checks that the comment exists and the author is the right author of the comment
        const commentExists = await prisma.exists.Comment({
            id: args.id, 
            author: {
                id: userId
            }
        })

        if(!commentExists) {
            throw new Error(`Someting went wrong`)
        }

        return prisma.mutation.updateComment({
            where: {
                id: args.id
            },
            data: args.data
        }, info)
    }
}

export { Mutation as default }