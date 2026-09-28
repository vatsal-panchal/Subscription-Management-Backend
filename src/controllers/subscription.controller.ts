import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Subscription } from '../models/Subscription';
import { Plan, IPlan } from '../models/Plan';

export const createSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { planId, autoRenew } = req.body;

    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
      res.status(400).json({
        success: false,
        message: 'Valid planId is required'
      });
      return;
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
      return;
    }

    if (!plan.isActive) {
      res.status(400).json({
        success: false,
        message: 'Cannot subscribe to an inactive plan'
      });
      return;
    }

    const existingActiveSubscription = await Subscription.findOne({
      user: req.user?.id,
      status: 'ACTIVE'
    });

    if (existingActiveSubscription) {
      const now = new Date();
      if (existingActiveSubscription.endDate > now) {
        res.status(400).json({
          success: false,
          message: 'You already have an active subscription'
        });
        return;
      }

      existingActiveSubscription.status = 'EXPIRED';
      await existingActiveSubscription.save();
    }

    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000
    );

    const subscription = await Subscription.create({
      user: req.user?.id,
      plan: plan._id,
      status: 'ACTIVE',
      startDate,
      endDate,
      autoRenew: Boolean(autoRenew)
    });

    await subscription.populate('plan');

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const activeSubscription = await Subscription.findOne({
      user: req.user?.id,
      status: 'ACTIVE'
    }).populate('plan');

    if (activeSubscription) {
      const now = new Date();
      if (activeSubscription.endDate <= now) {
        activeSubscription.status = 'EXPIRED';
        await activeSubscription.save();
        res.status(200).json({
          success: true,
          message: 'Subscription has expired',
          data: activeSubscription
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Current subscription retrieved successfully',
        data: activeSubscription
      });
      return;
    }

    const latestSubscription = await Subscription.findOne({
      user: req.user?.id
    })
      .sort({ createdAt: -1 })
      .populate('plan');

    if (latestSubscription) {
      res.status(200).json({
        success: true,
        message: 'Latest subscription retrieved',
        data: latestSubscription
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'No subscription found',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format'
      });
      return;
    }

    const subscription = await Subscription.findById(id);

    if (!subscription) {
      res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
      return;
    }

    if (subscription.user.toString() !== req.user?.id) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this subscription'
      });
      return;
    }

    if (subscription.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        message: 'Subscription is already cancelled'
      });
      return;
    }

    const now = new Date();
    if (subscription.endDate <= now || subscription.status === 'EXPIRED') {
      subscription.status = 'EXPIRED';
      await subscription.save();
      res.status(400).json({
        success: false,
        message: 'Cannot cancel an expired subscription'
      });
      return;
    }

    subscription.status = 'CANCELLED';
    subscription.autoRenew = false;
    await subscription.save();
    await subscription.populate('plan');

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

export const renewSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format'
      });
      return;
    }

    const subscription = await Subscription.findById(id);

    if (!subscription) {
      res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
      return;
    }

    if (subscription.user.toString() !== req.user?.id) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this subscription'
      });
      return;
    }

    const plan = await Plan.findById(subscription.plan);
    if (!plan) {
      res.status(404).json({
        success: false,
        message: 'Associated plan not found'
      });
      return;
    }

    if (!plan.isActive) {
      res.status(400).json({
        success: false,
        message: 'Cannot renew an inactive plan'
      });
      return;
    }

    const now = new Date();
    const baseDate = subscription.endDate > now && subscription.status === 'ACTIVE'
      ? subscription.endDate
      : now;

    subscription.startDate = subscription.status === 'ACTIVE' && subscription.endDate > now
      ? subscription.startDate
      : now;
    subscription.endDate = new Date(
      baseDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000
    );
    subscription.status = 'ACTIVE';

    await subscription.save();
    await subscription.populate('plan');

    res.status(200).json({
      success: true,
      message: 'Subscription renewed successfully',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

export const getUsage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user?.id,
      status: 'ACTIVE'
    }).populate('plan');

    if (!subscription) {
      res.status(200).json({
        success: true,
        message: 'No active subscription found',
        data: null
      });
      return;
    }

    const now = new Date();
    if (subscription.endDate <= now) {
      subscription.status = 'EXPIRED';
      await subscription.save();
      res.status(200).json({
        success: true,
        message: 'Current subscription has expired',
        data: null
      });
      return;
    }

    const plan = subscription.plan as unknown as IPlan;

    res.status(200).json({
      success: true,
      message: 'Usage details retrieved successfully',
      data: {
        plan: {
          name: plan.name,
          maxProjects: plan.maxProjects,
          maxStorage: plan.maxStorage
        },
        subscription: {
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
