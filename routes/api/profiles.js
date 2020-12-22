import { Router } from 'express';
import request from 'request';
import { get } from 'config';
const router = Router();
import auth from '../../middleware/auth';
import { check, validationResult } from 'express-validator';

import { findOne, findOneAndUpdate, find, findOneAndRemove } from '../../models/Profiles';
import { findOneAndRemove as _findOneAndRemove } from '../../models/User';
import { deleteMany } from '../../models/Post';

//@route    GET api/profiles/me
//@desc     Get current users profile
//@access   Private
router.get('/me', auth, async (req, res) => {
  try {
    const profiles = await findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar']);

    if (!profiles) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/profiles
// @desc     Create or update user profile
// @access   Private

router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required')
        .not()
        .isEmpty(),
      check('skills', 'Skills is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      university,
      location,
      bio
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (university) profileFields.university = university;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;


    try {
      // Using upsert option (creates new doc if no match is found):
      let profiles = await findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true }
      );
      res.json(profiles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/profiles
// @desc     Get all profiles
// @access   Public
router.get('/', async (req, res) => {
  try {
    const profiles = await find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profiles/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profiles = await findOne({
      user: req.params.user_id
    }).populate('user', ['name', 'avatar']);

    if (!profiles) return res.status(400).json({ msg: 'Profile not found' });

    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/profiles
// @desc     Delete profile, user & posts
// @access   Private
router.delete('/', auth, async (req, res) => {
  try {
    // Remove user posts
    await deleteMany({ user: req.user.id });
    // Remove profile
    await findOneAndRemove({ user: req.user.id });
    // Remove user
    await _findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/profiles/experience
// @desc     Add profile experience
// @access   Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('university', 'university is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      university,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      university,
      location,
      from,
      to,
      current,
      description
    };

    try {
      const profiles = await findOne({ user: req.user.id });

      profiles.experience.unshift(newExp);

      await profiles.save();

      res.json(profiles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    DELETE api/profiles/experience/:exp_id
// @desc     Delete experience from profile
// @access   Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const foundProfiles = await findOne({ user: req.user.id });

    foundProfiles.experience = foundProfiles.experience.filter(
      exp => exp._id.toString() !== req.params.exp_id
    );

    await foundProfiles.save();
    return res.status(200).json(foundProfiles);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// @route    PUT api/profiles/education
// @desc     Add profile education
// @access   Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required')
        .not()
        .isEmpty(),
      check('degree', 'Degree is required')
        .not()
        .isEmpty(),
      check('fieldofstudy', 'Field of study is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };

    try {
      const profiles = await findOne({ user: req.user.id });

      profiles.education.unshift(newEdu);

      await profiles.save();

      res.json(profiles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    DELETE api/profiles/education/:edu_id
// @desc     Delete education from profile
// @access   Private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const foundProfiles = await findOne({ user: req.user.id });
    const eduIds = foundProfiles.education.map(edu => edu._id.toString());
    const removeIndex = eduIds.indexOf(req.params.edu_id);
    if (removeIndex === -1) {
      return res.status(500).json({ msg: 'Server error' });
    } else {
      foundProfiles.education.splice(removeIndex, 1);
      await foundProfiles.save();
      return res.status(200).json(foundProfiles);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// @route    GET api/profiles/github/:username
// @desc     Get user repos from Github
// @access   Public
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${get(
        'githubClientId'
      )}&client_secret=${get('githubSecret')}`,
      method: 'GET',
      headers: {
        'user-agent': 'node.js'
      }
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No Github profile found' });
      }

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
