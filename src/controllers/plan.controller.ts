import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Plan } from '../models/Plan';

export const getPlans = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
    res.status(200).json({
      success: true,
      message: 'Active plans retrieved successfully',
      data: plans
    });
  } catch (error) {
    next(error);
  }
};

export const getPlanById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
      return;
    }

    const plan = await Plan.findById(id);

    if (!plan || (!plan.isActive && req.user?.role !== 'ADMIN')) {
      res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Plan retrieved successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      durationInDays,
      features,
      maxProjects,
      maxStorage,
      isActive
    } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Plan name is required'
      });
      return;
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Plan description is required'
      });
      return;
    }

    if (price === undefined || typeof price !== 'number' || price < 0) {
      res.status(400).json({
        success: false,
        message: 'Price must be a number greater than or equal to 0'
      });
      return;
    }

    if (
      durationInDays === undefined ||
      typeof durationInDays !== 'number' ||
      durationInDays <= 0 ||
      !Number.isInteger(durationInDays)
    ) {
      res.status(400).json({
        success: false,
        message: 'durationInDays must be an integer greater than 0'
      });
      return;
    }

    if (
      maxProjects === undefined ||
      typeof maxProjects !== 'number' ||
      maxProjects < 0 ||
      !Number.isInteger(maxProjects)
    ) {
      res.status(400).json({
        success: false,
        message: 'maxProjects must be an integer greater than or equal to 0'
      });
      return;
    }

    if (maxStorage === undefined || typeof maxStorage !== 'number' || maxStorage < 0) {
      res.status(400).json({
        success: false,
        message: 'maxStorage must be a number greater than or equal to 0'
      });
      return;
    }

    if (features !== undefined && !Array.isArray(features)) {
      res.status(400).json({
        success: false,
        message: 'Features must be an array of strings'
      });
      return;
    }

    const existingPlan = await Plan.findOne({ name: name.trim() });
    if (existingPlan) {
      res.status(400).json({
        success: false,
        message: 'A plan with this name already exists'
      });
      return;
    }

    const plan = await Plan.create({
      name: name.trim(),
      description: description.trim(),
      price,
      durationInDays,
      features: features || [],
      maxProjects,
      maxStorage,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
      return;
    }

    const plan = await Plan.findById(id);
    if (!plan) {
      res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
      return;
    }

    const {
      name,
      description,
      price,
      durationInDays,
      features,
      maxProjects,
      maxStorage,
      isActive
    } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Plan name must be a non-empty string'
        });
        return;
      }
      const existingPlan = await Plan.findOne({
        name: name.trim(),
        _id: { $ne: plan._id }
      });
      if (existingPlan) {
        res.status(400).json({
          success: false,
          message: 'A plan with this name already exists'
        });
        return;
      }
      plan.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Plan description must be a non-empty string'
        });
        return;
      }
      plan.description = description.trim();
    }

    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        res.status(400).json({
          success: false,
          message: 'Price must be a number greater than or equal to 0'
        });
        return;
      }
      plan.price = price;
    }

    if (durationInDays !== undefined) {
      if (
        typeof durationInDays !== 'number' ||
        durationInDays <= 0 ||
        !Number.isInteger(durationInDays)
      ) {
        res.status(400).json({
          success: false,
          message: 'durationInDays must be an integer greater than 0'
        });
        return;
      }
      plan.durationInDays = durationInDays;
    }

    if (maxProjects !== undefined) {
      if (
        typeof maxProjects !== 'number' ||
        maxProjects < 0 ||
        !Number.isInteger(maxProjects)
      ) {
        res.status(400).json({
          success: false,
          message: 'maxProjects must be an integer greater than or equal to 0'
        });
        return;
      }
      plan.maxProjects = maxProjects;
    }

    if (maxStorage !== undefined) {
      if (typeof maxStorage !== 'number' || maxStorage < 0) {
        res.status(400).json({
          success: false,
          message: 'maxStorage must be a number greater than or equal to 0'
        });
        return;
      }
      plan.maxStorage = maxStorage;
    }

    if (features !== undefined) {
      if (!Array.isArray(features)) {
        res.status(400).json({
          success: false,
          message: 'Features must be an array of strings'
        });
        return;
      }
      plan.features = features;
    }

    if (isActive !== undefined) {
      plan.isActive = Boolean(isActive);
    }

    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
      return;
    }

    const plan = await Plan.findByIdAndDelete(id);
    if (!plan) {
      res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
