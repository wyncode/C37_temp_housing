const express = require('express');
const router = new express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth')

const Listing = require('../models/listing')

// ***********************************************//
// Get all listings
// ***********************************************//

router.get('/listing', auth, async(req, res) => {
    const match = {};
    const sort = {};
    if (req.query.completed) {
        match.completed = req.query.completed === 'true';
    }
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    try {
        await req.user
        .populate({
            path: 'listings',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        })
        .execPopulate();
        res.send(req.user.listings);
    } catch (e) {
        res.status(500).send();
    }


});


// ***********************************************//
// Get a specific listings
// ***********************************************//


router.get('/listings/:id', auth, async (req, res) => {
    const _id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      res.status(400).send('Not a valid listing id');
    }
    try {
      const listing = await Listing.findOne({ _id, owner: req.user._id });
      if (!listing) {
        return res.status(404).send();
      }
      res.send(listing);
    } catch (e) {
      res.status(500).send();
    }
  });

  // ***********************************************//
// Create a listing
// ***********************************************//
router.post('/listings', auth, async (req, res) => {
    const listing = new Listing({
      ...req.body,
      owner: req.user._id
    });
    try {
      listing.save();
      res.status(201).send(listing);
    } catch (e) {
      res.status(400).send(e);
    }
  });
  
  // ***********************************************//
// Update a listing
// ***********************************************//
router.patch('/listings/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = [ 'title','description', 'address', 'images', 'price'];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }
    try {
      const listing = await Listing.findOne({
        _id: req.params.id,
        owner: req.user._id
      });
      if (!listing) {
        return res.status(404).send();
      }
      updates.forEach((update) => (listing[update] = req.body[update]));
      await listing.save();
      res.send(listing);
    } catch (e) {
      res.status(400).send(e);
    }
  });

  // ***********************************************//
// Delete a listing
// ***********************************************//
router.delete('/listings/:id', auth, async (req, res) => {
    try {
      const listing = await Listing.findOneAndDelete({
        _id: req.params.id,
        owner: req.user._id
      });
  
      if (!listing) {
        res.status(404).send();
      }
      res.send(listing);
    } catch (e) {
      res.status(500).send();
    }
  });
  
  module.exports = router;