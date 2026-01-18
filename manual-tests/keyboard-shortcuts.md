# Test Suite: Keyboard shortcuts

### TC - Search attachments
Steps: 
- Add some attachments, with titles and descriptions
- Press "cmd+f" / "ctrl+f" on your keyboard
- The searchbar should be selected, search some text and verify

### TC - Add attachment
Steps: 
- From the homepage, press "cmd+n"
- Verify the modal and file inputs open, select a file
- Press 'Enter' to submit


### TC - Navigate with cmd j and k
Steps: 
- From the homepage, with a bunch of attachmetns loaded
- Press Cmd+j
- Verify the next item is selected
- Press Cmd+k
- Verify the prev item is selected


### TC - CMD JK Wrap around
Steps: 
- From the homepage, with a bunch of attachmetns loaded, select the bottom item
- Press Cmd+j
- Verify it goes back to the top
- Do teh same for Cmd+k at teh top, goes to the bottom

### TC - CMD JK select first/last
Steps:
- From the homepage, with a bunch of attachments loaded
- Use the searchbar to get no active selection on left side (if you have a currently-selected attachment, search for somethign that doesn't match it)
- Press "Cmd+J"
- Verify first item is selected
- Do same with "Cmd+K"

### TC - Scroll follows navigation
Steps:
- Load enough attachments that you hvae to scroll to see more in the left-hand side
- use Cmd+J to nvaigate down
- Get to the end and keep going
- Verify the scrollbar follows you, you can still see the items you're selecting