import express from 'express'
import {
  getSeries, getSeriesById, createSeries, updateSeries,
  deleteSeries, addPostToSeries, removePostFromSeries
} from '../controllers/seriesController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getSeries)
router.get('/:id', getSeriesById)
router.post('/', protect, createSeries)
router.put('/:id', protect, updateSeries)
router.delete('/:id', protect, deleteSeries)
router.post('/:id/posts', protect, addPostToSeries)
router.delete('/:id/posts/:postId', protect, removePostFromSeries)

export default router
