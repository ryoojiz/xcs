---
title: 'Platform Updates － 2023-08-13'
date: '2023-08-13'

thumbnail: '/images/blog/launch/1.png'
thumbnailAlt: 'R&C XCS'

author: 'restrafes'
authorImage: '/images/authors/restrafes.png'

category: 'Updates'
---

Hello, and welcome to the first ever blog post on the platform! For our first post, we'll be going over some of the
updates that have been made to the platform since our beta launch.

Let's get started!

## Adding members just got an upgrade!

We've updated the member add flow to be more intuitive and easier to use. The new flow is shown below:

![Member flow](/images/blog/updates-2023-08-13/1.jpeg)

## 🔥🔥 Card member types 🔥🔥

In an ongoing effort to make XCS a full replacement to traditional access point readers, we've added a new member type:
card numbers! You can now specify what card numbers are accepted for each access point. Ranges are supported, so you
don't need to add each card number individually (e.g. 1-24.)

## In-app invitations have arrived!

We've added an in-app invitation system for organizations. This allows you to invite members to your organization
without having to share a link. Of course, you can still share a link if you want to.

![Organization invitations screen](/images/blog/updates-2023-08-13/2.jpeg)

## Access group priority levels

You can now specify a priority level for each access group. This allows you to specify which access groups' scan data
take precedence over others.

For example, if you have an access group with a priority level of 1 with the following scan data:

    {
        "isRestricted": true,
        "allowedFloors": [1, 3]
    }

－and another access group with a priority level of 2 with the following scan data:

    {
        "isRestricted": false,
        "allowedFloors": [1, 4, 5]
    }

－the following scan data will be returned for a member with both access groups:

    {
        "isRestricted": false,
        "allowedFloors": [1, 3, 4, 5]
    }

## Beta testers now get a sweet new badge! 🎉

We've added a new badge for beta testers! If you registered your XCS account before the platform was launched to the
public, you should have the badge already.

![Beta tester badge](/images/blog/updates-2023-08-13/3.jpeg)

## Other features & changes

- You are now able to upload custom icons to your organization.
- Organizations now get a public page.

That wraps up this blog post! We hope you enjoy the features as much as we enjoyed making them. If you have any feedback
or suggestions, please let us know in our [official Discord server!](https://discord.gg/BWVa3yE9M3)

Until next time,

restrafes
