import { Link } from "react-router";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { messages } from "@/messages";

import { Piece, PieceNote, State } from "../Piece";
import { SectionPage } from "./SectionPage";
import {
  AccountSwitcherState,
  DarkHeaderDemo,
  FiltersDemo,
  FiltersInContextDemo,
  FooterDemo,
  HeaderDemo,
  SearchDemo,
  ShellDesktopDemo,
  ShellPhoneDemo,
  SideMenuDemo,
  StickyHeaderDemo,
} from "./nav-demos";

const t = messages.workbench.demos;

export function NavigationPage() {
  return (
    <SectionPage id="navigation">
      <Piece id="app-shell">
        <State label={t.appShell.desktop} note={t.appShell.desktopNote}>
          <ShellDesktopDemo />
        </State>
        <State label={t.appShell.phone} note={t.appShell.phoneNote}>
          <ShellPhoneDemo />
        </State>
        <PieceNote paragraphs={t.appShell.explain} />
      </Piece>

      <Piece id="side-menu">
        <State label={t.sideMenu.label} note={t.sideMenu.note} wide>
          <SideMenuDemo />
        </State>
        <PieceNote paragraphs={t.sideMenu.explain} />
      </Piece>

      <Piece id="header">
        <State label={t.header.full} note={t.header.fullNote} wide>
          <HeaderDemo />
        </State>
        <State label={t.header.sticky} note={t.header.stickyNote}>
          <StickyHeaderDemo />
        </State>
        <State label={t.header.dark} note={t.header.darkNote}>
          <DarkHeaderDemo />
        </State>
        <PieceNote paragraphs={t.header.explain} />
      </Piece>

      <Piece id="breadcrumb">
        <State label={t.breadcrumb.links} note={t.breadcrumb.linksNote}>
          <Breadcrumb
            items={t.breadcrumb.items.map((label, i) =>
              // The third step has no page yet: it shows as text.
              i === 2 ? { label } : { label, link: <Link to="/navigation#breadcrumb" /> },
            )}
          />
        </State>
        <State label={t.breadcrumb.narrow} note={t.breadcrumb.narrowNote}>
          <Breadcrumb items={t.breadcrumb.deep.map((label) => ({ label, href: "#breadcrumb" }))} />
        </State>
        <PieceNote paragraphs={t.breadcrumb.explain} />
      </Piece>

      <Piece id="footer">
        <State label={t.footer.full} note={t.footer.fullNote} wide>
          <FooterDemo />
        </State>
        <State label={t.footer.dark} note={t.footer.darkNote} wide>
          <FooterDemo forceDark />
        </State>
        <PieceNote paragraphs={t.footer.explain} />
      </Piece>

      <Piece id="search">
        <State label={t.search.floating} note={t.search.floatingNote}>
          <SearchDemo variant="floating" />
        </State>
        <State label={t.search.inline} note={t.search.inlineNote}>
          <SearchDemo variant="inline" />
        </State>
        <State label={t.search.large} note={t.search.largeNote}>
          <SearchDemo variant="large" />
        </State>
        <State label={t.search.fullScreen} note={t.search.fullScreenNote}>
          <SearchDemo variant="full-screen" />
        </State>
        <PieceNote paragraphs={t.search.explain} />
      </Piece>

      <Piece id="filters">
        <State label={t.filters.context} note={t.filters.contextNote} wide>
          <FiltersInContextDemo />
        </State>
        <State label={t.filters.alone} note={t.filters.aloneNote}>
          <FiltersDemo initial={{ category: ["backpacks"], color: ["black", "navy"] }} />
        </State>
        <State label={t.filters.zero} note={t.filters.zeroNote}>
          <FiltersDemo initial={{ category: ["wallets"] }} />
        </State>
        <PieceNote paragraphs={t.filters.explain} />
      </Piece>

      <Piece id="account-switcher">
        <State label={t.accountSwitcher.label} note={t.accountSwitcher.labelNote}>
          <AccountSwitcherState />
        </State>
        <State label={t.accountSwitcher.ended} note={t.accountSwitcher.endedNote}>
          <AccountSwitcherState ended />
        </State>
        <PieceNote paragraphs={t.accountSwitcher.explain} />
      </Piece>
    </SectionPage>
  );
}
