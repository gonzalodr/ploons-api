import { Request, Response } from "express";
import { z } from "zod";
import { StatusCodes } from "http-status-codes";
import { SearchService } from "@module/search/search.service";
import { AppError } from "@utils/appError.utils";
import { catchAsync } from "@utils/catchAsync.utils";

export class SearchController {
    private searchService: SearchService;

    constructor() {
        this.searchService = new SearchService();
    }
    // 1. search recipes
    searchRecipe = catchAsync(async (req: Request, res: Response) => {
        // 1. validate query
        const { q, page, limit } = this.validateQueryParams(req.query);
        // 2. call services
        const result = await this.searchService.searchRecipes(q, page, limit);
        // 3. send result
        return res.status(StatusCodes.OK).json(result);
    });

    // 2. search profile
    searchProfile = catchAsync(async (req: Request, res: Response) => {
        // 1. validate query
        const { q, page, limit } = this.validateQueryParams(req.query);
        // 2. call services
        const results = await this.searchService.searchProfiles(q, page, limit);
        // 3. send data
        return res.status(StatusCodes.OK).json(results);
    });

    // 3. validate querys
    private validateQueryParams(query: any) {
        const querySchema = z.object({
            q: z.string().min(2, "La búsqueda debe tener al menos 2 caracteres").max(50),
            page: z.preprocess((val) => parseInt(val as string) || 1, z.number().min(1)),
            limit: z.preprocess((val) => parseInt(val as string) || 10, z.number().min(1))
        });

        const result = querySchema.safeParse(query);

        if (!result.success) {
            throw new AppError(result.error.issues[0].message, StatusCodes.BAD_REQUEST);
        }

        return result.data;
    }
}