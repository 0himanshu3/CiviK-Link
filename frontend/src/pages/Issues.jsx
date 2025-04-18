import React from 'react'
import IssueDetail from '../components/IssueDetail'
const sampleIssue = {
    title: "Broken Water Pipeline in Sector 21",
    tags: ["Water", "Sanitation"],
    content: "The main water pipeline near the community park has burst, causing waterlogging and hygiene issues. Needs immediate attention.",
    images: [
      {
        url: "https://letsenhance.io/static/73136da51c245e80edc6ccfe44888a99/1015f/MainBefore.jpg",
        caption: "Burst pipeline near the park"
      },
      {
        url: "https://letsenhance.io/static/73136da51c245e80edc6ccfe44888a99/1015f/MainBefore.jpg",
        caption: "Waterlogging on street"
      }
    ],
    videos: [
      {
        url: "https://example.com/videos/water-issue.mp4",
        caption: "Footage of the leaking pipe"
      }
    ],
    issueLocation: "Sector 21, Newtown",
    postedBy: "65e6b347ff9a435a9381b9e2",
    assignedTo: null,
    status: "Open",
    upvoters: ["65e6b347ff9a435a9381b9e2"],
    downvoters: [],
    isFlagged: false,
    comments: [
      {
        user: "65e6b347ff9a435a9381b9e3",
        text: "This needs to be fixed ASAP. Kids can't go out to play.",
        date: new Date()
      }
    ]
  };
  
export default function Issues() {
  return (
    <div>
        <IssueDetail issue={sampleIssue} />
      
    </div>
  )
}

