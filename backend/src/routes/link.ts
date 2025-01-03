import { v4 as uuidv4 } from "uuid";
import { Router } from "express";
import { brainLinkModel, contentModel } from "../db";
import { userAuthMiddleware } from "../middlewares";

export const linkRouter = Router();

// creating link and updating it's share-able status.
// May need to change this approach in future,
// might have to make different enpoints for creating link and updating link.
linkRouter.post("/share", userAuthMiddleware, async (req, res) => {
    const userId = req.userId;
    const share: boolean = req.body.share;

    if (share === undefined || share === null) {
        res.status(404).json({
            msg: "No choice provided for share-able link.",
        });
        return;
    }

    try {
        const shareableLink = await brainLinkModel.findOne({ userId });

        if (shareableLink) {
            if (shareableLink.share === share) {
                res.status(200).json({ msg: "No need to update link status" });
                return;
            }

            const updatedLink = await brainLinkModel.findOneAndUpdate(
                { _id: shareableLink.id },
                { $set: { share } },
                { new: true }
            );

            res.status(200).json({
                msg: "Link share status updated.",
                link: updatedLink,
            });
        } else {
            const hash = uuidv4();
            const createdLink = await brainLinkModel.create({
                hash,
                share,
                userId,
            });

            res.status(200).json({
                msg: `new link created with share-able status as: ${share}`,
                link: createdLink,
            });
        }
    } catch (error) {
        res.status(500).json({
            msg: "Failed to update share-able link.",
        });
    }
});

// getting content with share-able link.
linkRouter.get("/:shareLink", async (req, res) => {
    const shareLink: string = req.params.shareLink;

    try {
        const brainLink = await brainLinkModel.findOne({ hash: shareLink });

        if (brainLink) {
            const brainContent = await contentModel
                .find({
                    userId: brainLink.userId,
                })
                .populate({ path: "tags", select: "title" });

            if (brainContent) {
                res.status(200).json({ brainContent });
            } else {
                res.status(404).json({
                    msg: "No content found with provided link. User might have no content stored.",
                });
            }
        } else {
            res.status(404).json({
                msg: "No content found with provided link.",
            });
        }
    } catch (error) {
        res.status(500).json({
            msg: "Failed to fetch content with provided link.",
        });
    }
});
